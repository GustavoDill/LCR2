import { Router } from 'express';
import { getDb } from '../config/firebase.js';
import { authenticate, requireWrite } from '../middlewares/auth.js';
import { NatalEvento, NatalTarefa, NatalGasto } from '../types/index.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const [evSnap, tkSnap, gsSnap] = await Promise.all([
      db.doc('natal/evento').get(),
      db.collection('natal-tarefas').get(),
      db.collection('natal-gastos').get(),
    ]);

    const evento: NatalEvento = evSnap.exists
      ? ({ ...evSnap.data(), id: 'evento' } as NatalEvento)
      : { id: 'evento', nome: 'Festa de Natal da Ala Bosque' };

    const tarefas: NatalTarefa[] = tkSnap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as NatalTarefa[];

    const gastos: NatalGasto[] = gsSnap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as NatalGasto[];

    res.json({ evento, tarefas, gastos });
  } catch (error) {
    console.error('Error fetching natal data:', error);
    res.status(500).json({ error: 'Erro ao carregar planejamento de Natal.' });
  }
});

router.post('/evento', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const updateData = {
      ...req.body,
      atualizadoEm: Date.now(),
    };
    delete updateData.id;

    await db.doc('natal/evento').set(updateData, { merge: true });
    res.json({ id: 'evento', ...updateData });
  } catch (error) {
    console.error('Error saving natal evento:', error);
    res.status(500).json({ error: 'Erro ao salvar dados da festa.' });
  }
});

// Tarefas
router.post('/tarefas', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { titulo, area, status, responsavel, prazo, antes, obs } = req.body;

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ error: 'Título da tarefa é obrigatório.' });
    }

    const now = Date.now();
    const newDoc: any = {
      titulo: titulo.trim(),
      area: area || 'Programação',
      status: status || 'pendente',
      responsavel: responsavel || '',
      prazo: prazo || '',
      obs: obs || '',
      criadoEm: now,
      atualizadoEm: now,
    };
    if (antes !== undefined && antes !== null && antes !== '') {
      newDoc.antes = Number(antes);
    }

    const docRef = await db.collection('natal-tarefas').add(newDoc);
    res.status(201).json({ id: docRef.id, ...newDoc });
  } catch (error) {
    console.error('Error creating natal tarefa:', error);
    res.status(500).json({ error: 'Erro ao salvar tarefa de Natal.' });
  }
});

router.put('/tarefas/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const docRef = db.doc(`natal-tarefas/${id}`);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    const updated = {
      ...req.body,
      atualizadoEm: Date.now(),
    };
    delete updated.id;

    await docRef.update(updated);
    res.json({ id, ...snap.data(), ...updated });
  } catch (error) {
    console.error('Error updating natal tarefa:', error);
    res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
  }
});

router.post('/tarefas/:id/toggle', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { checked } = req.body;
    const docRef = db.doc(`natal-tarefas/${id}`);

    await docRef.update({
      status: checked ? 'concluida' : 'pendente',
      atualizadoEm: Date.now(),
    });

    res.json({ success: true, id, status: checked ? 'concluida' : 'pendente' });
  } catch (error) {
    console.error('Error toggling natal tarefa:', error);
    res.status(500).json({ error: 'Erro ao alterar status da tarefa.' });
  }
});

router.delete('/tarefas/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    await db.doc(`natal-tarefas/${id}`).delete();
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting natal tarefa:', error);
    res.status(500).json({ error: 'Erro ao excluir tarefa.' });
  }
});

router.post('/tarefas/batch', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Nenhum item fornecido.' });
    }

    const now = Date.now();
    const created = [];

    for (const item of items) {
      const doc: any = {
        titulo: item.titulo,
        area: item.area,
        obs: item.obs || '',
        responsavel: item.responsavel || '',
        prazo: item.prazo || '',
        status: 'pendente',
        criadoEm: now,
        atualizadoEm: now,
      };
      if (item.antes !== undefined && item.antes !== null && item.antes !== '') {
        doc.antes = Number(item.antes);
      }
      const ref = await db.collection('natal-tarefas').add(doc);
      created.push({ id: ref.id, ...doc });
    }

    res.status(201).json(created);
  } catch (error) {
    console.error('Error batch adding natal tarefas:', error);
    res.status(500).json({ error: 'Erro ao adicionar tarefas em lote.' });
  }
});

// Gastos
router.post('/gastos', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { descricao, valor, data, area, responsavel, nota, syncToFinanceiro } = req.body;

    if (!descricao || !descricao.trim()) {
      return res.status(400).json({ error: 'Descrição é obrigatória.' });
    }
    const val = Number(valor);
    if (!val || val <= 0) {
      return res.status(400).json({ error: 'Valor deve ser maior que zero.' });
    }

    const now = Date.now();
    let finId: string | undefined = undefined;

    // Optional sync to main ward finance ledger if requested
    if (syncToFinanceiro && req.user?.isBishopric) {
      try {
        const purchaseDate = data || new Date().toISOString().split('T')[0];
        const [y, m] = purchaseDate.split('-').map(Number);
        const periodo = `${y}-T${Math.floor((m - 1) / 3) + 1}`;

        const finRef = db.doc(`conf/b/financeiro/${periodo}`);
        const finSnap = await finRef.get();
        if (finSnap.exists) {
          const linhas = finSnap.data()?.linhas || [];
          const natalLine = linhas.find((l: any) => /natal/i.test(l.nome));
          if (natalLine) {
            const fDoc = await db.collection('conf/b/lancamentos').add({
              periodo,
              linha: natalLine.id,
              valor: Math.round(val * 100) / 100,
              descricao: `Festa de Natal: ${descricao.trim()}`,
              data: purchaseDate,
              nota: nota || '',
              solicitante: responsavel || '',
              criadoEm: now,
              atualizadoEm: now,
            });
            finId = fDoc.id;
          }
        }
      } catch (err) {
        console.error('Could not sync Christmas expense to main finance ledger:', err);
      }
    }

    const newGasto: Omit<NatalGasto, 'id'> = {
      descricao: descricao.trim(),
      valor: Math.round(val * 100) / 100,
      data: data || new Date().toISOString().split('T')[0],
      area: area || 'Churrasco',
      responsavel: responsavel || '',
      nota: nota || '',
      finId,
      criadoEm: now,
      atualizadoEm: now,
    };

    const docRef = await db.collection('natal-gastos').add(newGasto);
    res.status(201).json({ id: docRef.id, ...newGasto });
  } catch (error) {
    console.error('Error creating natal gasto:', error);
    res.status(500).json({ error: 'Erro ao registrar gasto de Natal.' });
  }
});

router.put('/gastos/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const docRef = db.doc(`natal-gastos/${id}`);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Gasto não encontrado.' });
    }

    const val = Number(req.body.valor);
    const updated = {
      ...req.body,
      valor: isFinite(val) ? Math.round(val * 100) / 100 : snap.data()?.valor,
      atualizadoEm: Date.now(),
    };
    delete updated.id;

    await docRef.update(updated);
    res.json({ id, ...snap.data(), ...updated });
  } catch (error) {
    console.error('Error updating natal gasto:', error);
    res.status(500).json({ error: 'Erro ao atualizar gasto.' });
  }
});

router.delete('/gastos/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    await db.doc(`natal-gastos/${id}`).delete();
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting natal gasto:', error);
    res.status(500).json({ error: 'Erro ao excluir gasto.' });
  }
});

export default router;
