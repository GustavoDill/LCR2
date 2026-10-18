import { Router } from 'express';
import { getDb } from '../config/firebase.js';
import { authenticate, requireWrite, requireBishopric } from '../middlewares/auth.js';
import { Designacao, OriginType, TaskStatus } from '../types/index.js';

const router = Router();

const colName = (origin: OriginType) => (origin === 'bispado' ? 'conf/b/designacoes' : 'designacoes');

router.get('/', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const isBisp = req.user?.isBishopric ?? false;

    const conselhoSnap = await db.collection('designacoes').get();
    const conselhoItems: Designacao[] = conselhoSnap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      origem: 'conselho',
    })) as Designacao[];

    let bispadoItems: Designacao[] = [];
    if (isBisp) {
      const bispSnap = await db.collection('conf/b/designacoes').get();
      bispadoItems = bispSnap.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        origem: 'bispado',
      })) as Designacao[];
    }

    res.json([...conselhoItems, ...bispadoItems]);
  } catch (error) {
    console.error('Error fetching designações:', error);
    res.status(500).json({ error: 'Erro ao carregar designações.' });
  }
});

router.post('/', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { titulo, responsavel, prazo, status, proximo, origem, ataId } = req.body;

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ error: 'O título da designação é obrigatório.' });
    }

    const targetOrigin: OriginType = (origem === 'bispado' && req.user?.isBishopric) ? 'bispado' : 'conselho';
    const now = Date.now();

    const newDoc: any = {
      titulo: titulo.trim(),
      responsavel: responsavel?.trim() || '',
      prazo: prazo || '',
      status: (status as TaskStatus) || 'pendente',
      proximo: proximo?.trim() || '',
      origem: targetOrigin,
      criadoEm: now,
      atualizadoEm: now,
    };

    if (ataId) {
      newDoc.ataId = ataId;
    }

    const docRef = await db.collection(colName(targetOrigin)).add(newDoc);
    res.status(201).json({ id: docRef.id, ...newDoc });
  } catch (error) {
    console.error('Error creating designação:', error);
    res.status(500).json({ error: 'Erro ao salvar designação.' });
  }
});

router.put('/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { titulo, responsavel, prazo, status, proximo, origem } = req.body;
    const currentOrigin: OriginType = req.body.currentOrigin || origem || 'conselho';

    if (currentOrigin === 'bispado' && !req.user?.isBishopric) {
      return res.status(403).json({ error: 'Sem permissão para alterar esta designação.' });
    }

    const targetOrigin: OriginType = (origem === 'bispado' && req.user?.isBishopric) ? 'bispado' : 'conselho';
    const docPath = `${colName(currentOrigin)}/${id}`;
    const docRef = db.doc(docPath);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Designação não encontrada.' });
    }

    const updatedData = {
      titulo: titulo !== undefined ? titulo.trim() : docSnap.data()?.titulo,
      responsavel: responsavel !== undefined ? responsavel.trim() : docSnap.data()?.responsavel,
      prazo: prazo !== undefined ? prazo : docSnap.data()?.prazo,
      status: status !== undefined ? status : docSnap.data()?.status,
      proximo: proximo !== undefined ? proximo.trim() : docSnap.data()?.proximo,
      atualizadoEm: Date.now(),
    };

    if (currentOrigin !== targetOrigin && req.user?.isBishopric) {
      // Move between collections
      const fullDoc = { ...docSnap.data(), ...updatedData, origem: targetOrigin };
      delete (fullDoc as any).id;
      await db.doc(`${colName(targetOrigin)}/${id}`).set(fullDoc);
      await docRef.delete();
      return res.json({ id, ...fullDoc });
    }

    await docRef.update(updatedData);
    res.json({ id, ...docSnap.data(), ...updatedData });
  } catch (error) {
    console.error('Error updating designação:', error);
    res.status(500).json({ error: 'Erro ao atualizar designação.' });
  }
});

router.post('/:id/cycle', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { origem = 'conselho' } = req.body;

    if (origem === 'bispado' && !req.user?.isBishopric) {
      return res.status(403).json({ error: 'Acesso restrito.' });
    }

    const docPath = `${colName(origem)}/${id}`;
    const docRef = db.doc(docPath);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Designação não encontrada.' });
    }

    const cur = snap.data()?.status || 'pendente';
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      pendente: 'andamento',
      andamento: 'concluida',
      concluida: 'pendente',
    };
    const newStatus = nextStatus[cur as TaskStatus] || 'pendente';

    await docRef.update({
      status: newStatus,
      atualizadoEm: Date.now(),
    });

    res.json({ id, status: newStatus });
  } catch (error) {
    console.error('Error cycling designação status:', error);
    res.status(500).json({ error: 'Erro ao alterar situação.' });
  }
});

router.delete('/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { origem = 'conselho' } = req.query;

    if (origem === 'bispado' && !req.user?.isBishopric) {
      return res.status(403).json({ error: 'Acesso restrito.' });
    }

    await db.doc(`${colName(origem as OriginType)}/${id}`).delete();
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting designação:', error);
    res.status(500).json({ error: 'Erro ao excluir designação.' });
  }
});

export default router;
