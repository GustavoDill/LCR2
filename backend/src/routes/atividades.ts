import { Router } from 'express';
import { getDb } from '../config/firebase.js';
import { authenticate, requireWrite, requireBishopric } from '../middlewares/auth.js';
import { Atividade, AprovacaoAtividade, SolicitanteInfo } from '../types/index.js';
import { sendActivityDecisionEmail } from '../services/email.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const atvSnap = await db.collection('atividades').get();
    const aprovSnap = await db.collection('aprovacoes').get();

    const aprovacoes: Record<string, AprovacaoAtividade> = {};
    aprovSnap.docs.forEach(doc => {
      aprovacoes[doc.id] = doc.data() as AprovacaoAtividade;
    });

    const atividades: Atividade[] = atvSnap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Atividade[];

    res.json({ atividades, aprovacoes });
  } catch (error) {
    console.error('Error fetching atividades:', error);
    res.status(500).json({ error: 'Erro ao carregar atividades.' });
  }
});

router.post('/', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const now = Date.now();

    const solicitante: SolicitanteInfo = {
      uid: req.user?.uid || 'anon',
      nome: req.user?.displayName || req.body.responsavel || 'Membro da Ala',
      email: req.user?.email || '',
      cargo: req.user?.cargo || (req.user?.isBishopric ? 'Bispado' : 'Líder'),
      organizacao: req.user?.organizacao || req.body.org || '',
    };

    const docData: any = {
      ...req.body,
      solicitante,
      criadoEm: now,
      atualizadoEm: now,
    };

    const docRef = await db.collection('atividades').add(docData);
    res.status(201).json({ id: docRef.id, ...docData });
  } catch (error) {
    console.error('Error creating atividade:', error);
    res.status(500).json({ error: 'Erro ao submeter atividade.' });
  }
});

router.put('/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const docRef = db.doc(`atividades/${id}`);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Atividade não encontrada.' });
    }

    const updatedData = {
      ...req.body,
      atualizadoEm: Date.now(),
    };
    delete updatedData.id;

    await docRef.update(updatedData);

    // If this ticket was in 'ajustes', editing and resubmitting moves it back to 'aguardando'
    try {
      const aprovRef = db.doc(`aprovacoes/${id}`);
      const aprovSnap = await aprovRef.get();
      if (aprovSnap.exists) {
        const aprovData = aprovSnap.data() as AprovacaoAtividade;
        if (aprovData?.status === 'ajustes') {
          await aprovRef.update({
            status: 'aguardando',
            decididoEm: Date.now(),
          });
        }
      }
    } catch (aprovErr) {
      console.warn('Could not reset aprovacao status to aguardando:', aprovErr);
    }

    res.json({ id, ...snap.data(), ...updatedData });
  } catch (error) {
    console.error('Error updating atividade:', error);
    res.status(500).json({ error: 'Erro ao atualizar atividade.' });
  }
});

// Bishopric decision (Aprovar, Pedir Ajustes, Recusar)
router.post('/:id/decide', authenticate, requireBishopric, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { status, comentario, addToAgenda } = req.body;

    if (!status || !['aprovada', 'ajustes', 'recusada'].includes(status)) {
      return res.status(400).json({ error: 'Status de decisão inválido.' });
    }

    // Comentário obrigatório para ajustes ou recusa
    if ((status === 'ajustes' || status === 'recusada') && (!comentario || !comentario.trim())) {
      const motivoNome = status === 'recusada' ? 'o motivo da reprovação' : 'as instruções de alteração';
      return res.status(400).json({ error: `Por favor, informe ${motivoNome} para o solicitante.` });
    }

    const atvRef = db.doc(`atividades/${id}`);
    const atvSnap = await atvRef.get();

    if (!atvSnap.exists) {
      return res.status(404).json({ error: 'Atividade não encontrada.' });
    }

    const atv = atvSnap.data() as Atividade;
    const aprovRef = db.doc(`aprovacoes/${id}`);
    const aprovSnap = await aprovRef.get();
    const prevAprov = aprovSnap.data() as AprovacaoAtividade | undefined;

    let agendaId = prevAprov?.agendaId || null;

    if (status === 'aprovada' && addToAgenda && !agendaId) {
      const locationText = atv.local === 'capela' ? 'Capela da Ala Bosque' : atv.localOutro || '';
      const timeText = atv.inicio ? ` · ${atv.inicio}` : '';
      const agendaRef = await db.collection('agenda').add({
        titulo: atv.titulo,
        data: atv.data,
        org: atv.org,
        proposito: atv.proposito || '',
        responsavel: atv.responsavel || '',
        obs: locationText + timeText,
      });
      agendaId = agendaRef.id;
    }

    const decision: AprovacaoAtividade = {
      status,
      comentario: comentario?.trim() || '',
      decididoEm: Date.now(),
      decididoPor: req.user
        ? {
            uid: req.user.uid,
            nome: req.user.displayName || 'Membro do Bispado',
            cargo: req.user.cargo,
          }
        : undefined,
      agendaId,
    };

    await aprovRef.set(decision);

    // Send decision email automatically to the solicitante
    const recipientEmail = atv.solicitante?.email;
    const recipientName = atv.solicitante?.nome || atv.responsavel || 'Líder';

    if (recipientEmail) {
      sendActivityDecisionEmail({
        to: recipientEmail,
        solicitanteNome: recipientName,
        atividadeTitulo: atv.titulo,
        dataAtividade: atv.data,
        organizacao: atv.org,
        status,
        comentario: decision.comentario,
        decididoPorNome: req.user?.displayName || 'Bispado Ala Bosque',
      }).catch(err => {
        console.error('Error sending decision email in background:', err);
      });
    } else {
      console.log(`[Atividades] Nenhum e-mail de solicitante cadastrado para a atividade ${id}.`);
    }

    res.json(decision);
  } catch (error) {
    console.error('Error deciding atividade:', error);
    res.status(500).json({ error: 'Erro ao registrar decisão do bispado.' });
  }
});

// Post-activity feedback
router.post('/:id/feedback', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { fbSucesso, fbMembros, fbNaoMembros, fbMelhorar } = req.body;

    const atvRef = db.doc(`atividades/${id}`);
    const atvSnap = await atvRef.get();

    if (!atvSnap.exists) {
      return res.status(404).json({ error: 'Atividade não encontrada.' });
    }

    const updateData = {
      fbSucesso: fbSucesso?.trim() || '',
      fbMembros: fbMembros !== '' && fbMembros != null ? Number(fbMembros) : '',
      fbNaoMembros: fbNaoMembros !== '' && fbNaoMembros != null ? Number(fbNaoMembros) : '',
      fbMelhorar: fbMelhorar?.trim() || '',
      fbEm: Date.now(),
    };

    await atvRef.update(updateData);
    res.json({ id, ...updateData });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Erro ao salvar feedback da atividade.' });
  }
});

router.delete('/:id', authenticate, requireBishopric, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    await db.doc(`atividades/${id}`).delete();
    await db.doc(`aprovacoes/${id}`).delete();

    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting atividade:', error);
    res.status(500).json({ error: 'Erro ao excluir atividade.' });
  }
});

export default router;
