import { Router } from 'express';
import { getDb } from '../config/firebase.js';
import { authenticate, requireWrite } from '../middlewares/auth.js';
import { IndicadorMensal } from '../types/index.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('indicadores').get();

    const indicadores: Record<string, IndicadorMensal> = {};
    snap.docs.forEach(doc => {
      indicadores[doc.id] = { ...doc.data(), id: doc.id, mes: doc.id } as IndicadorMensal;
    });

    res.json(indicadores);
  } catch (error) {
    console.error('Error fetching indicadores:', error);
    res.status(500).json({ error: 'Erro ao carregar indicadores.' });
  }
});

router.post('/:mes', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { mes } = req.params;
    const { key, value } = req.body;

    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
      return res.status(400).json({ error: 'Mês inválido (formato esperado: YYYY-MM).' });
    }

    const docRef = db.doc(`indicadores/${mes}`);
    const snap = await docRef.get();

    const numValue = value === '' || value == null ? null : Number(value);
    const updatePayload = {
      mes,
      [key]: isFinite(numValue as number) ? numValue : null,
      atualizadoEm: Date.now(),
    };

    if (snap.exists) {
      await docRef.update(updatePayload);
    } else {
      await docRef.set(updatePayload);
    }

    res.json({ mes, key, value: updatePayload[key] });
  } catch (error) {
    console.error('Error updating indicador:', error);
    res.status(500).json({ error: 'Erro ao salvar indicador.' });
  }
});

export default router;
