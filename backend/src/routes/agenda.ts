import { Router } from 'express';
import { getDb } from '../config/firebase.js';
import { authenticate, requireWrite } from '../middlewares/auth.js';
import { AgendaEvento } from '../types/index.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('agenda').get();
    const items: AgendaEvento[] = snap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as AgendaEvento[];

    items.sort((a, b) => String(a.data).localeCompare(String(b.data)));
    res.json(items);
  } catch (error) {
    console.error('Error fetching agenda:', error);
    res.status(500).json({ error: 'Erro ao carregar agenda.' });
  }
});

router.post('/', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { titulo, data, org, proposito, responsavel, obs } = req.body;

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ error: 'Título do evento é obrigatório.' });
    }
    if (!data) {
      return res.status(400).json({ error: 'Data do evento é obrigatória.' });
    }

    const newDoc: Omit<AgendaEvento, 'id'> = {
      titulo: titulo.trim(),
      data,
      org: org || 'Ala',
      proposito: proposito || '',
      responsavel: responsavel || '',
      obs: obs || '',
    };

    const docRef = await db.collection('agenda').add(newDoc);
    res.status(201).json({ id: docRef.id, ...newDoc });
  } catch (error) {
    console.error('Error adding evento to agenda:', error);
    res.status(500).json({ error: 'Erro ao agendar evento.' });
  }
});

router.put('/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const docRef = db.doc(`agenda/${id}`);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }

    const updatedData = { ...req.body };
    delete updatedData.id;

    await docRef.update(updatedData);
    res.json({ id, ...snap.data(), ...updatedData });
  } catch (error) {
    console.error('Error updating evento agenda:', error);
    res.status(500).json({ error: 'Erro ao atualizar evento.' });
  }
});

router.delete('/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    await db.doc(`agenda/${id}`).delete();
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting evento agenda:', error);
    res.status(500).json({ error: 'Erro ao excluir evento.' });
  }
});

export default router;
