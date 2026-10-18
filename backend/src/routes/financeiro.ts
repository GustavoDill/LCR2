import { Router } from 'express';
import { getDb } from '../config/firebase.js';
import { authenticate, requirePermission, requireBishopric, requireWrite } from '../middlewares/auth.js';
import { FinanceiroTrimestre, LancamentoFinanceiro } from '../types/index.js';

const router = Router();
router.use(authenticate, requirePermission('financeiro'));

// Get quarterly budgets and all ledger expenses
router.get('/data', async (req, res) => {
  try {
    const db = getDb();
    const finSnap = await db.collection('conf/b/financeiro').get();
    const lancSnap = await db.collection('conf/b/lancamentos').get();

    const orcamentos: Record<string, FinanceiroTrimestre> = {};
    finSnap.docs.forEach(doc => {
      orcamentos[doc.id] = { ...doc.data(), periodo: doc.id } as FinanceiroTrimestre;
    });

    const lancamentos: LancamentoFinanceiro[] = lancSnap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as LancamentoFinanceiro[];

    res.json({ orcamentos, lancamentos });
  } catch (error) {
    console.error('Error fetching financeiro data:', error);
    res.status(500).json({ error: 'Erro ao carregar dados financeiros.' });
  }
});

// Save or update quarterly budget
router.post('/budget', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { periodo, recebido, linhas } = req.body;

    if (!periodo || !/^\d{4}-T[1-4]$/.test(periodo)) {
      return res.status(400).json({ error: 'Período inválido (formato esperado: YYYY-T1 a YYYY-T4).' });
    }

    const budgetDoc: FinanceiroTrimestre = {
      periodo,
      recebido: Number(recebido) || 0,
      linhas: linhas || [],
      atualizadoEm: Date.now(),
    };

    await db.doc(`conf/b/financeiro/${periodo}`).set(budgetDoc);
    res.json(budgetDoc);
  } catch (error) {
    console.error('Error saving budget:', error);
    res.status(500).json({ error: 'Erro ao salvar orçamento.' });
  }
});

// Expense ledger CRUD
router.post('/lancamentos', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { periodo, linha, valor, descricao, data, nota, solicitante } = req.body;

    if (!descricao || !descricao.trim()) {
      return res.status(400).json({ error: 'Descrição da despesa é obrigatória.' });
    }
    const val = Number(valor);
    if (!val || val <= 0) {
      return res.status(400).json({ error: 'Valor da despesa deve ser maior que zero.' });
    }

    const now = Date.now();
    const newLancamento: Omit<LancamentoFinanceiro, 'id'> = {
      periodo,
      linha,
      valor: Math.round(val * 100) / 100,
      descricao: descricao.trim(),
      data: data || new Date().toISOString().split('T')[0],
      nota: nota?.trim() || '',
      solicitante: solicitante?.trim() || '',
      criadoEm: now,
      atualizadoEm: now,
    };

    const docRef = await db.collection('conf/b/lancamentos').add(newLancamento);
    res.status(201).json({ id: docRef.id, ...newLancamento });
  } catch (error) {
    console.error('Error adding lançamento:', error);
    res.status(500).json({ error: 'Erro ao registrar despesa.' });
  }
});

router.put('/lancamentos/:id', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const docRef = db.doc(`conf/b/lancamentos/${id}`);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Lançamento não encontrado.' });
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
    console.error('Error updating lançamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar despesa.' });
  }
});

router.delete('/lancamentos/:id', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    await db.doc(`conf/b/lancamentos/${id}`).delete();
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting lançamento:', error);
    res.status(500).json({ error: 'Erro ao excluir despesa.' });
  }
});

// CSV Export
router.get('/export/csv', async (req, res) => {
  try {
    const db = getDb();
    const finSnap = await db.collection('conf/b/financeiro').get();
    const lancSnap = await db.collection('conf/b/lancamentos').get();

    const orgMap: Record<string, string> = {};
    finSnap.docs.forEach(doc => {
      const data = doc.data();
      const periodo = doc.id;
      (data.linhas || []).forEach((l: any) => {
        orgMap[`${periodo}|${l.id}`] = l.nome;
      });
    });

    const lancamentos = lancSnap.docs.map(d => d.data()) as LancamentoFinanceiro[];
    lancamentos.sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));

    const q = (v: any) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const rows = [
      ['Data', 'Trimestre', 'Organização', 'Descrição', 'Nota', 'Solicitado por', 'Valor'],
      ...lancamentos.map(x => [
        x.data,
        x.periodo,
        orgMap[`${x.periodo}|${x.linha}`] || 'Linha removida',
        x.descricao,
        x.nota || '',
        x.solicitante || '',
        Number(x.valor || 0).toFixed(2).replace('.', ','),
      ]),
    ];

    const csvContent = '\uFEFF' + rows.map(r => r.map(q).join(';')).join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="lancamentos-ala-bosque.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Erro ao gerar arquivo CSV.' });
  }
});

export default router;
