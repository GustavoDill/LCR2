import { Router } from 'express';
import { getDb } from '../config/firebase.js';
import { authenticate, requirePermission, requireBishopric, requireWrite } from '../middlewares/auth.js';
import { Organizacao, Cargo, CargoHistorico } from '../types/index.js';

const router = Router();
router.use(authenticate, requirePermission('chamados'));

const newId = (prefix: string) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

router.get('/organizacoes', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('conf/b/chamados').get();
    let orgs: Organizacao[] = snap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Organizacao[];

    orgs.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    res.json(orgs);
  } catch (error) {
    console.error('Error fetching organizações:', error);
    res.status(500).json({ error: 'Erro ao carregar lista de chamados.' });
  }
});

router.post('/organizacoes', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { nome, grupo } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome da organização é obrigatório.' });
    }

    const orgId = newId('o');
    const existing = await db.collection('conf/b/chamados').get();
    const ordem = existing.size + 1;

    const newOrg: Organizacao = {
      id: orgId,
      nome: nome.trim(),
      grupo: grupo || 'Outros',
      ordem,
      cargos: [],
    };

    await db.doc(`conf/b/chamados/${orgId}`).set(newOrg);
    res.status(201).json(newOrg);
  } catch (error) {
    console.error('Error creating organização:', error);
    res.status(500).json({ error: 'Erro ao criar organização.' });
  }
});

router.post('/organizacoes/:orgId/cargos', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { orgId } = req.params;
    const { titulo, pessoa, desde } = req.body;

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ error: 'O título do chamado é obrigatório.' });
    }

    const orgRef = db.doc(`conf/b/chamados/${orgId}`);
    const snap = await orgRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Organização não encontrada.' });
    }

    const org = snap.data() as Organizacao;
    const newCargo: Cargo = {
      id: newId('c'),
      titulo: titulo.trim(),
      pessoa: pessoa ? pessoa.trim() : '',
      desde: pessoa && desde ? desde : (pessoa ? new Date().toISOString().split('T')[0] : ''),
      historico: [],
    };

    const updatedCargos = [...(org.cargos || []), newCargo];
    await orgRef.update({ cargos: updatedCargos });

    res.status(201).json(newCargo);
  } catch (error) {
    console.error('Error adding cargo:', error);
    res.status(500).json({ error: 'Erro ao adicionar chamado.' });
  }
});

router.post('/organizacoes/:orgId/cargos/:cargoId/swap', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { orgId, cargoId } = req.params;
    const { nome, modo, data, titulo, desobrigarAtual } = req.body;

    const orgRef = db.doc(`conf/b/chamados/${orgId}`);
    const snap = await orgRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Organização não encontrada.' });
    }

    const org = snap.data() as Organizacao;
    const targetCargo = (org.cargos || []).find(c => c.id === cargoId);
    if (!targetCargo) {
      return res.status(404).json({ error: 'Chamado não encontrado.' });
    }

    const effectiveDate = data || new Date().toISOString().split('T')[0];
    const newTitle = titulo?.trim() || targetCargo.titulo;
    const cleanNome = nome?.trim() || '';

    let updatedCargo: Cargo = { ...targetCargo, titulo: newTitle };

    if (cleanNome && modo === 'agora') {
      const hist: CargoHistorico[] = targetCargo.pessoa
        ? [{ pessoa: targetCargo.pessoa, desde: targetCargo.desde || '', ate: effectiveDate }, ...(targetCargo.historico || [])]
        : (targetCargo.historico || []);

      updatedCargo = {
        ...updatedCargo,
        pessoa: cleanNome,
        desde: effectiveDate,
        historico: hist.slice(0, 20),
        pendente: null,
      };
    } else if (cleanNome && modo === 'processo') {
      const label = `${newTitle} · ${org.nome}`;
      const now = Date.now();

      // Create tracking person in conf/b/pessoas
      const ref = await db.collection('conf/b/pessoas').add({
        nome: cleanNome,
        tipo: 'chamado',
        detalhe: 'Indicado',
        chamado: label,
        proxima: 'Entrevista com o bispado',
        responsavel: 'Bispo',
        status: 'aberto',
        criadoEm: now,
        atualizadoEm: now,
        cargoRef: { org: orgId, cargo: cargoId },
      });

      updatedCargo = {
        ...updatedCargo,
        pendente: {
          pessoa: cleanNome,
          pid: ref.id,
          data: effectiveDate,
        },
      };

      // Optional release of current person
      if (targetCargo.pessoa && desobrigarAtual) {
        await db.collection('conf/b/pessoas').add({
          nome: targetCargo.pessoa,
          tipo: 'chamado',
          detalhe: 'Desobrigação',
          chamado: label,
          proxima: 'Desobrigar na reunião sacramental',
          status: 'aberto',
          criadoEm: now,
          atualizadoEm: now,
        });
      }
    }

    const updatedCargos = (org.cargos || []).map(c => (c.id === cargoId ? updatedCargo : c));
    await orgRef.update({ cargos: updatedCargos });

    res.json({ cargo: updatedCargo });
  } catch (error) {
    console.error('Error swapping cargo:', error);
    res.status(500).json({ error: 'Erro ao trocar chamado.' });
  }
});

router.post('/organizacoes/:orgId/cargos/:cargoId/vagar', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { orgId, cargoId } = req.params;
    const { data } = req.body;

    const orgRef = db.doc(`conf/b/chamados/${orgId}`);
    const snap = await orgRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Organização não encontrada.' });
    }

    const org = snap.data() as Organizacao;
    const targetCargo = (org.cargos || []).find(c => c.id === cargoId);
    if (!targetCargo) {
      return res.status(404).json({ error: 'Chamado não encontrado.' });
    }

    const effectiveDate = data || new Date().toISOString().split('T')[0];
    const hist: CargoHistorico[] = targetCargo.pessoa
      ? [{ pessoa: targetCargo.pessoa, desde: targetCargo.desde || '', ate: effectiveDate }, ...(targetCargo.historico || [])]
      : (targetCargo.historico || []);

    const updatedCargo: Cargo = {
      ...targetCargo,
      pessoa: '',
      desde: '',
      historico: hist.slice(0, 20),
      pendente: null,
    };

    const updatedCargos = (org.cargos || []).map(c => (c.id === cargoId ? updatedCargo : c));
    await orgRef.update({ cargos: updatedCargos });

    res.json({ cargo: updatedCargo });
  } catch (error) {
    console.error('Error marking cargo vacant:', error);
    res.status(500).json({ error: 'Erro ao deixar chamado vago.' });
  }
});

router.post('/organizacoes/:orgId/cargos/:cargoId/apply-pending', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { orgId, cargoId } = req.params;

    const orgRef = db.doc(`conf/b/chamados/${orgId}`);
    const snap = await orgRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Organização não encontrada.' });
    }

    const org = snap.data() as Organizacao;
    const targetCargo = (org.cargos || []).find(c => c.id === cargoId);
    if (!targetCargo || !targetCargo.pendente) {
      return res.status(400).json({ error: 'Não há troca pendente neste chamado.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const hist: CargoHistorico[] = targetCargo.pessoa
      ? [{ pessoa: targetCargo.pessoa, desde: targetCargo.desde || '', ate: today }, ...(targetCargo.historico || [])]
      : (targetCargo.historico || []);

    const updatedCargo: Cargo = {
      ...targetCargo,
      pessoa: targetCargo.pendente.pessoa,
      desde: today,
      historico: hist.slice(0, 20),
      pendente: null,
    };

    if (targetCargo.pendente.pid) {
      try {
        await db.doc(`conf/b/pessoas/${targetCargo.pendente.pid}`).update({
          status: 'concluido',
          atualizadoEm: Date.now(),
        });
      } catch (e) {
        // Ignored if already removed
      }
    }

    const updatedCargos = (org.cargos || []).map(c => (c.id === cargoId ? updatedCargo : c));
    await orgRef.update({ cargos: updatedCargos });

    res.json({ cargo: updatedCargo });
  } catch (error) {
    console.error('Error applying pending cargo:', error);
    res.status(500).json({ error: 'Erro ao concluir troca de chamado.' });
  }
});

router.post('/organizacoes/:orgId/cargos/:cargoId/cancel-pending', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { orgId, cargoId } = req.params;

    const orgRef = db.doc(`conf/b/chamados/${orgId}`);
    const snap = await orgRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Organização não encontrada.' });
    }

    const org = snap.data() as Organizacao;
    const targetCargo = (org.cargos || []).find(c => c.id === cargoId);
    if (!targetCargo) {
      return res.status(404).json({ error: 'Chamado não encontrado.' });
    }

    // Also delete linked tracking person from conf/b/pessoas if present
    if (targetCargo.pendente?.pid) {
      try {
        await db.doc(`conf/b/pessoas/${targetCargo.pendente.pid}`).delete();
      } catch (err) {
        console.error('Error deleting linked pessoa in cancel-pending:', err);
      }
    }

    const updatedCargo: Cargo = {
      ...targetCargo,
      pendente: null,
    };

    const updatedCargos = (org.cargos || []).map(c => (c.id === cargoId ? updatedCargo : c));
    await orgRef.update({ cargos: updatedCargos });

    res.json({ cargo: updatedCargo });
  } catch (error) {
    console.error('Error canceling pending cargo:', error);
    res.status(500).json({ error: 'Erro ao cancelar troca.' });
  }
});

router.delete('/organizacoes/:orgId/cargos/:cargoId', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { orgId, cargoId } = req.params;

    const orgRef = db.doc(`conf/b/chamados/${orgId}`);
    const snap = await orgRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Organização não encontrada.' });
    }

    const org = snap.data() as Organizacao;
    const updatedCargos = (org.cargos || []).filter(c => c.id !== cargoId);
    await orgRef.update({ cargos: updatedCargos });

    res.json({ success: true, cargoId });
  } catch (error) {
    console.error('Error deleting cargo:', error);
    res.status(500).json({ error: 'Erro ao excluir chamado.' });
  }
});

export default router;
