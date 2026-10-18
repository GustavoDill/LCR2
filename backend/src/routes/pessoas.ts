import { Router } from 'express';
import { getDb } from '../config/firebase.js';
import { authenticate, requirePermission, requireBishopric, requireWrite } from '../middlewares/auth.js';
import { Pessoa } from '../types/index.js';

const router = Router();
const CH_FLOW = ['Indicado', 'Aprovação do bispado', 'Entrevista', 'Apoio na sacramental', 'Designação'];
const D_FLOW = ['Conversar com a pessoa', 'Desobrigar na sacramental', 'Atualizar no LCR'];

router.use(authenticate, requirePermission('pessoas'));

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const { tipo } = req.query;

    const snap = await db.collection('conf/b/pessoas').get();
    let items: Pessoa[] = snap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Pessoa[];

    if (tipo) {
      items = items.filter(p => p.tipo === tipo);
    }

    res.json(items);
  } catch (error) {
    console.error('Error fetching pessoas:', error);
    res.status(500).json({ error: 'Erro ao carregar lista de pessoas.' });
  }
});

router.post('/', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { nome, tipo, detalhe, chamado, proxima, responsavel, prazo, obs, cargoRef } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome é obrigatório.' });
    }

    const now = Date.now();
    const newDoc: Omit<Pessoa, 'id'> = {
      nome: nome.trim(),
      tipo: tipo || 'acomp',
      detalhe: detalhe || '',
      chamado: chamado || '',
      proxima: proxima || '',
      responsavel: responsavel || '',
      prazo: prazo || '',
      obs: obs || '',
      status: 'aberto',
      dpasso: 0,
      cargoRef: cargoRef || undefined,
      criadoEm: now,
      atualizadoEm: now,
    };

    const docRef = await db.collection('conf/b/pessoas').add(newDoc);
    res.status(201).json({ id: docRef.id, ...newDoc });
  } catch (error) {
    console.error('Error creating pessoa:', error);
    res.status(500).json({ error: 'Erro ao salvar pessoa.' });
  }
});

router.put('/:id', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const docRef = db.doc(`conf/b/pessoas/${id}`);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Registro não encontrado.' });
    }

    const updatedData = {
      ...req.body,
      atualizadoEm: Date.now(),
    };
    delete updatedData.id;

    await docRef.update(updatedData);
    res.json({ id, ...snap.data(), ...updatedData });
  } catch (error) {
    console.error('Error updating pessoa:', error);
    res.status(500).json({ error: 'Erro ao atualizar registro.' });
  }
});

router.post('/:id/toggle', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const docRef = db.doc(`conf/b/pessoas/${id}`);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Registro não encontrado.' });
    }

    const cur = snap.data()?.status || 'aberto';
    const nextStatus = cur === 'concluido' ? 'aberto' : 'concluido';

    await docRef.update({
      status: nextStatus,
      atualizadoEm: Date.now(),
    });

    res.json({ id, status: nextStatus });
  } catch (error) {
    console.error('Error toggling pessoa status:', error);
    res.status(500).json({ error: 'Erro ao alternar status.' });
  }
});

// Advance calling pipeline (Indicado -> Aprovação -> Entrevista -> Apoio -> Designação -> Concluído)
router.post('/:id/advance-chamado', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const docRef = db.doc(`conf/b/pessoas/${id}`);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Pessoa não encontrada.' });
    }

    const p = snap.data() as Pessoa;
    const curStage = !p.detalhe || p.detalhe === 'Proposto' ? 'Indicado' : p.detalhe;
    const i = CH_FLOW.indexOf(curStage);

    let bodyUpdate: Partial<Pessoa> = {};
    let callingConcluded = false;

    if (i >= 0 && i < CH_FLOW.length - 1) {
      bodyUpdate = {
        detalhe: CH_FLOW[i + 1],
        atualizadoEm: Date.now(),
      };
    } else {
      bodyUpdate = {
        status: 'concluido',
        atualizadoEm: Date.now(),
      };
      callingConcluded = true;
    }

    await docRef.update(bodyUpdate);

    // If calling is concluded and has cargoRef, apply automatically to organization
    if (callingConcluded && p.cargoRef?.org && p.cargoRef?.cargo) {
      try {
        const orgRef = db.doc(`conf/b/chamados/${p.cargoRef.org}`);
        const orgSnap = await orgRef.get();
        if (orgSnap.exists) {
          const orgData = orgSnap.data();
          const today = new Date().toISOString().split('T')[0];
          const cargos = (orgData?.cargos || []).map((c: any) => {
            if (c.id === p.cargoRef!.cargo) {
              const hist = c.pessoa
                ? [{ pessoa: c.pessoa, desde: c.desde || '', ate: today }, ...(c.historico || [])]
                : (c.historico || []);
              return {
                ...c,
                pessoa: p.nome,
                desde: today,
                historico: hist.slice(0, 20),
                pendente: null,
              };
            }
            return c;
          });
          await orgRef.update({ cargos });
        }
      } catch (err) {
        console.error('Error applying concluded calling to organization:', err);
      }
    }

    res.json({ ...p, ...bodyUpdate, id });
  } catch (error) {
    console.error('Error advancing calling flow:', error);
    res.status(500).json({ error: 'Erro ao avançar etapa do chamado.' });
  }
});

// Advance release checklist (Conversar -> Desobrigar -> Atualizar no LCR -> Concluído)
router.post('/:id/advance-desobrigacao', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const docRef = db.doc(`conf/b/pessoas/${id}`);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Pessoa não encontrada.' });
    }

    const p = snap.data() as Pessoa;
    const curStep = Number(p.dpasso || 0);

    let bodyUpdate: Partial<Pessoa> = {};
    if (curStep < D_FLOW.length - 1) {
      bodyUpdate = {
        dpasso: curStep + 1,
        atualizadoEm: Date.now(),
      };
    } else {
      bodyUpdate = {
        dpasso: D_FLOW.length,
        status: 'concluido',
        atualizadoEm: Date.now(),
      };
    }

    await docRef.update(bodyUpdate);
    res.json({ ...p, ...bodyUpdate, id });
  } catch (error) {
    console.error('Error advancing release flow:', error);
    res.status(500).json({ error: 'Erro ao avançar desobrigação.' });
  }
});

router.delete('/:id', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    await db.doc(`conf/b/pessoas/${id}`).delete();
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting pessoa:', error);
    res.status(500).json({ error: 'Erro ao excluir pessoa.' });
  }
});

export default router;
