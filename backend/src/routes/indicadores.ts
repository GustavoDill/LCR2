import { Router } from 'express';
import { getDb } from '../config/firebase.js';
import { authenticate, requireWrite } from '../middlewares/auth.js';
import { IndicadorMensal } from '../types/index.js';

const router = Router();

// Initial reference information from Claude artifact
export const SEED_INDICADORES: Record<string, Partial<IndicadorMensal>> = {
  '2026-10': {
    mes: '2026-10',
    sacramental: 150,
    jovens: 20,
    primaria: 15,
    ensinados: 8,
    retorno: 5,
    templo: 70,
    ministracao: 100,
    ordenancas: 4,
    ensino: null,
    servico: 2,
    autossuf: 5,
  },
};

// GET all indicadores (as map Record<string, IndicadorMensal>)
router.get('/', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('indicadores').get();

    const indicadores: Record<string, IndicadorMensal> = {};
    snap.docs.forEach(doc => {
      indicadores[doc.id] = { ...doc.data(), id: doc.id, mes: doc.id } as IndicadorMensal;
    });

    // Auto-seed reference data if collection is completely empty
    if (Object.keys(indicadores).length === 0) {
      for (const [m, data] of Object.entries(SEED_INDICADORES)) {
        const item = { ...data, id: m, mes: m, atualizadoEm: Date.now() } as IndicadorMensal;
        await db.doc(`indicadores/${m}`).set(item);
        indicadores[m] = item;
      }
    }

    res.json(indicadores);
  } catch (error) {
    console.error('Error fetching indicadores:', error);
    res.json(SEED_INDICADORES);
  }
});

// GET single month indicador
router.get('/:mes', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const { mes } = req.params;

    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
      return res.status(400).json({ error: 'Mês inválido (formato esperado: YYYY-MM).' });
    }

    const doc = await db.doc(`indicadores/${mes}`).get();
    if (!doc.exists) {
      // If reference data exists for this month, seed it
      if (SEED_INDICADORES[mes]) {
        const item = { ...SEED_INDICADORES[mes], id: mes, mes, atualizadoEm: Date.now() } as IndicadorMensal;
        await db.doc(`indicadores/${mes}`).set(item);
        return res.json(item);
      }
      return res.json({ id: mes, mes });
    }

    res.json({ ...doc.data(), id: doc.id, mes: doc.id });
  } catch (error) {
    console.error('Error fetching indicador:', error);
    res.status(500).json({ error: 'Erro ao carregar indicador.' });
  }
});

// PUT full month indicators
router.put('/:mes', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { mes } = req.params;

    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
      return res.status(400).json({ error: 'Mês inválido (formato esperado: YYYY-MM).' });
    }

    const docRef = db.doc(`indicadores/${mes}`);
    const payload = {
      ...req.body,
      id: mes,
      mes,
      atualizadoEm: Date.now(),
    };

    await docRef.set(payload, { merge: true });
    const snap = await docRef.get();
    res.json({ ...snap.data(), id: mes, mes });
  } catch (error) {
    console.error('Error updating indicador (PUT):', error);
    res.status(500).json({ error: 'Erro ao salvar indicadores.' });
  }
});

// POST single field update or full object
router.post('/:mes', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { mes } = req.params;
    const { key, value } = req.body;

    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
      return res.status(400).json({ error: 'Mês inválido (formato esperado: YYYY-MM).' });
    }

    const docRef = db.doc(`indicadores/${mes}`);
    let updatePayload: any;

    if (key !== undefined) {
      const numValue = value === '' || value == null ? null : Number(value);
      updatePayload = {
        mes,
        id: mes,
        [key]: isFinite(numValue as number) ? numValue : null,
        atualizadoEm: Date.now(),
      };
    } else {
      updatePayload = {
        ...req.body,
        id: mes,
        mes,
        atualizadoEm: Date.now(),
      };
    }

    await docRef.set(updatePayload, { merge: true });
    const snap = await docRef.get();
    res.json({ ...snap.data(), id: mes, mes, key, value: updatePayload[key] });
  } catch (error) {
    console.error('Error updating indicador (POST):', error);
    res.status(500).json({ error: 'Erro ao salvar indicador.' });
  }
});

// POST /seed endpoint
router.post('/seed/force', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const seeded: Record<string, any> = {};
    for (const [m, data] of Object.entries(SEED_INDICADORES)) {
      const item = { ...data, id: m, mes: m, atualizadoEm: Date.now() };
      await db.doc(`indicadores/${m}`).set(item);
      seeded[m] = item;
    }
    res.json({ success: true, seeded });
  } catch (error) {
    console.error('Error force seeding indicadores:', error);
    res.status(500).json({ error: 'Erro ao popular dados de indicadores.' });
  }
});

export default router;
