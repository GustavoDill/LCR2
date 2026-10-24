import { Router } from 'express';
import { getDb } from '../config/firebase.js';
import { authenticate, requirePermission, requireBishopric, requireWrite } from '../middlewares/auth.js';
import { Pessoa } from '../types/index.js';

const router = Router();
const CH_FLOW = ['Indicado', 'Aprovação do bispado', 'Entrevista', 'Apoio na sacramental', 'Designação'];
const D_FLOW = ['Conversar com a pessoa', 'Desobrigar na sacramental', 'Atualizar no LCR'];

router.use(authenticate);

function hasPessoasAccess(user: any): boolean {
  if (user?.isBishopric || user?.role === 'bispado') return true;
  const p = user?.permissoes?.pessoas;
  return p === true || p === 'write' || p === 'read';
}

function hasChamadosAccess(user: any): boolean {
  if (user?.isBishopric || user?.role === 'bispado') return true;
  const p = user?.permissoes?.chamados;
  return p === true || p === 'write' || p === 'read';
}

function canMutatePessoa(user: any, tipo?: string): boolean {
  if (user?.isBishopric || user?.role === 'bispado') return true;
  if (user?.canWrite === false) return false;
  const hasPessoasWrite = user?.permissoes?.pessoas === true || user?.permissoes?.pessoas === 'write';
  if (hasPessoasWrite) return true;
  const hasChamadosWrite = user?.permissoes?.chamados === true || user?.permissoes?.chamados === 'write';
  if (hasChamadosWrite && (tipo === 'chamado' || !tipo)) return true;
  return false;
}

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const { tipo } = req.query;

    const canPessoas = hasPessoasAccess(req.user);
    const canChamados = hasChamadosAccess(req.user);

    if (!canPessoas && !canChamados) {
      return res.status(403).json({ error: 'Acesso negado aos registros de pessoas e chamados.' });
    }

    const snap = await db.collection('conf/b/pessoas').get();
    let items: Pessoa[] = snap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Pessoa[];

    // If user only has chamados permission (not general pessoas), restrict strictly to chamados
    if (!canPessoas) {
      items = items.filter(p => p.tipo === 'chamado');
    } else if (tipo) {
      items = items.filter(p => p.tipo === tipo);
    }

    res.json(items);
  } catch (error) {
    console.error('Error fetching pessoas:', error);
    res.json([]);
  }
});

router.post('/', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { nome, tipo, detalhe, chamado, proxima, responsavel, prazo, obs, cargoRef } = req.body;

    if (!canMutatePessoa(req.user, tipo)) {
      return res.status(403).json({ error: 'Acesso restrito para criar este tipo de registro.' });
    }

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome é obrigatório.' });
    }

    const now = Date.now();
    const newDoc: any = {
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
      criadoEm: now,
      atualizadoEm: now,
    };

    if (cargoRef) {
      newDoc.cargoRef = cargoRef;
    }

    const docRef = await db.collection('conf/b/pessoas').add(newDoc);

    // If linked to an organization cargo, register the pending state in conf/b/chamados
    if (cargoRef?.org && cargoRef?.cargo && (tipo === 'chamado' || !tipo)) {
      try {
        const orgRef = db.doc(`conf/b/chamados/${cargoRef.org}`);
        const orgSnap = await orgRef.get();
        if (orgSnap.exists) {
          const orgData = orgSnap.data();
          const today = new Date().toISOString().split('T')[0];
          const cargos = (orgData?.cargos || []).map((c: any) => {
            if (c.id === cargoRef.cargo) {
              return {
                ...c,
                pendente: {
                  pessoa: newDoc.nome,
                  pid: docRef.id,
                  data: newDoc.prazo || today,
                  etapa: newDoc.detalhe || 'Indicado',
                },
              };
            }
            return c;
          });
          await orgRef.update({ cargos });
        }
      } catch (err) {
        console.error('Error setting pending cargo in POST /pessoas:', err);
      }
    }

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

    if (!canMutatePessoa(req.user, snap.data()?.tipo)) {
      return res.status(403).json({ error: 'Acesso restrito para alterar este registro.' });
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

    if (!canMutatePessoa(req.user, snap.data()?.tipo)) {
      return res.status(403).json({ error: 'Acesso restrito para excluir este registro.' });
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

    // If calling has cargoRef, synchronize stage or conclude calling in organization
    if (p.cargoRef?.org && p.cargoRef?.cargo) {
      try {
        const orgRef = db.doc(`conf/b/chamados/${p.cargoRef.org}`);
        const orgSnap = await orgRef.get();
        if (orgSnap.exists) {
          const orgData = orgSnap.data();
          const today = new Date().toISOString().split('T')[0];
          const cargos = (orgData?.cargos || []).map((c: any) => {
            if (c.id === p.cargoRef!.cargo) {
              if (callingConcluded) {
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
              } else {
                // Update intermediate stage
                return {
                  ...c,
                  pendente: {
                    ...(c.pendente || {}),
                    pessoa: p.nome,
                    pid: id,
                    etapa: bodyUpdate.detalhe,
                  },
                };
              }
            }
            return c;
          });
          await orgRef.update({ cargos });
        }
      } catch (err) {
        console.error('Error applying calling update to organization:', err);
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
    let desobConcluded = false;

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
      desobConcluded = true;
    }

    await docRef.update(bodyUpdate);

    // If release is concluded and has cargoRef, mark the calling as vacant in conf/b/chamados
    if (desobConcluded && p.cargoRef?.org && p.cargoRef?.cargo) {
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
                pessoa: '',
                desde: '',
                historico: hist.slice(0, 20),
                pendente: null,
              };
            }
            return c;
          });
          await orgRef.update({ cargos });
        }
      } catch (err) {
        console.error('Error marking released calling vacant in organization:', err);
      }
    }

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
    const docRef = db.doc(`conf/b/pessoas/${id}`);
    const snap = await docRef.get();

    if (snap.exists) {
      const p = snap.data() as Pessoa;
      // If linked to an organization cargo pending swap, clean up the pending state
      if (p.cargoRef?.org && p.cargoRef?.cargo) {
        try {
          const orgRef = db.doc(`conf/b/chamados/${p.cargoRef.org}`);
          const orgSnap = await orgRef.get();
          if (orgSnap.exists) {
            const orgData = orgSnap.data();
            const cargos = (orgData?.cargos || []).map((c: any) => {
              if (c.id === p.cargoRef!.cargo && (c.pendente?.pid === id || !c.pendente?.pid)) {
                return { ...c, pendente: null };
              }
              return c;
            });
            await orgRef.update({ cargos });
          }
        } catch (orgErr) {
          console.error('Error clearing pending calling from organization:', orgErr);
        }
      }
      await docRef.delete();
    }

    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting pessoa:', error);
    res.status(500).json({ error: 'Erro ao excluir pessoa.' });
  }
});

export default router;
