import { Router } from 'express';
import { getDb } from '../config/firebase.js';
import { authenticate, requireWrite, requireBishopric } from '../middlewares/auth.js';
import { Ata, MeetingType } from '../types/index.js';

const router = Router();
const ataCol = (t: MeetingType) => (t === 'bispado' ? 'conf/b/atas' : 'atas');

const getAtasHandler = async (req: any, res: any) => {
  try {
    const db = getDb();
    const isBisp = req.user?.isBishopric ?? false;

    const conselhoSnap = await db.collection('atas').get();
    const conselhoAtas: Ata[] = conselhoSnap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      tipo: 'conselho',
    })) as Ata[];

    let bispadoAtas: Ata[] = [];
    if (isBisp) {
      const bispSnap = await db.collection('conf/b/atas').get();
      bispadoAtas = bispSnap.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        tipo: 'bispado',
      })) as Ata[];
    }

    res.json([...conselhoAtas, ...bispadoAtas]);
  } catch (error) {
    console.error('Error fetching atas:', error);
    res.status(500).json({ error: 'Erro ao carregar atas.' });
  }
};

router.get('/', authenticate, getAtasHandler);
router.get('/atas', authenticate, getAtasHandler);

router.put('/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { tipo = 'conselho' } = req.body;

    if (tipo === 'bispado' && !req.user?.isBishopric) {
      return res.status(403).json({ error: 'Acesso restrito.' });
    }

    const docRef = db.doc(`${ataCol(tipo)}/${id}`);
    const snap = await docRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Reunião não encontrada.' });
    }

    const updatedData = { ...req.body };
    delete updatedData.id;

    await docRef.update(updatedData);
    res.json({ id, ...snap.data(), ...updatedData });
  } catch (error) {
    console.error('Error updating meeting details:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados da reunião.' });
  }
});

router.post('/start', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { tipo, data } = req.body;

    if (!tipo || (tipo !== 'bispado' && tipo !== 'conselho')) {
      return res.status(400).json({ error: 'Tipo de reunião inválido.' });
    }

    if (tipo === 'bispado' && !req.user?.isBishopric) {
      return res.status(403).json({ error: 'Acesso restrito ao Bispado.' });
    }

    const meetingDate = data || new Date().toISOString().split('T')[0];
    const newDoc: Omit<Ata, 'id'> = {
      tipo,
      data: meetingDate,
      status: 'aberta',
      inicioEm: Date.now(),
      notas: {},
      tratados: {},
    };

    const docRef = await db.collection(ataCol(tipo)).add(newDoc);
    res.status(201).json({ id: docRef.id, ...newDoc });
  } catch (error) {
    console.error('Error starting meeting:', error);
    res.status(500).json({ error: 'Erro ao iniciar reunião.' });
  }
});

router.post('/:id/note', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { tipo = 'conselho', key, value } = req.body;

    if (tipo === 'bispado' && !req.user?.isBishopric) {
      return res.status(403).json({ error: 'Acesso restrito.' });
    }

    if (!key) {
      return res.status(400).json({ error: 'Chave da anotação não informada.' });
    }

    const docRef = db.doc(`${ataCol(tipo)}/${id}`);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Reunião não encontrada.' });
    }

    const currentNotes = snap.data()?.notas || {};
    const updatedNotes = {
      ...currentNotes,
      [key]: value || '',
    };

    await docRef.update({
      notas: updatedNotes,
    });

    res.json({ success: true, key, value });
  } catch (error) {
    console.error('Error updating meeting notes:', error);
    res.status(500).json({ error: 'Erro ao salvar anotação.' });
  }
});

router.post('/:id/tratado', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { tipo = 'conselho', sec, checked } = req.body;

    if (tipo === 'bispado' && !req.user?.isBishopric) {
      return res.status(403).json({ error: 'Acesso restrito.' });
    }

    const docRef = db.doc(`${ataCol(tipo)}/${id}`);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Reunião não encontrada.' });
    }

    const currentTratados = snap.data()?.tratados || {};
    const updatedTratados = {
      ...currentTratados,
      [sec]: Boolean(checked),
    };

    await docRef.update({
      tratados: updatedTratados,
    });

    res.json({ success: true, sec, checked });
  } catch (error) {
    console.error('Error toggling tratado:', error);
    res.status(500).json({ error: 'Erro ao atualizar status da seção.' });
  }
});

router.post('/:id/end', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { tipo = 'conselho' } = req.body;

    if (tipo === 'bispado' && !req.user?.isBishopric) {
      return res.status(403).json({ error: 'Acesso restrito.' });
    }

    const docRef = db.doc(`${ataCol(tipo)}/${id}`);
    await docRef.update({
      status: 'encerrada',
      fimEm: Date.now(),
    });

    res.json({ success: true, id, status: 'encerrada' });
  } catch (error) {
    console.error('Error ending meeting:', error);
    res.status(500).json({ error: 'Erro ao encerrar reunião.' });
  }
});

router.post('/:id/reopen', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    let { tipo } = req.body || {};

    if (!tipo) {
      const consDoc = await db.doc(`atas/${id}`).get();
      if (consDoc.exists) {
        tipo = 'conselho';
      } else {
        const bispDoc = await db.doc(`conf/b/atas/${id}`).get();
        if (bispDoc.exists) {
          tipo = 'bispado';
        } else {
          return res.status(404).json({ error: 'Reunião não encontrada.' });
        }
      }
    }

    if (tipo === 'bispado' && !req.user?.isBishopric) {
      return res.status(403).json({ error: 'Acesso restrito ao Bispado.' });
    }

    const docRef = db.doc(`${ataCol(tipo)}/${id}`);
    await docRef.update({
      status: 'aberta',
      inicioEm: Date.now(),
    });

    res.json({ success: true, id, status: 'aberta' });
  } catch (error) {
    console.error('Error reopening meeting:', error);
    res.status(500).json({ error: 'Erro ao reabrir reunião.' });
  }
});

const deleteMeetingHandler = async (req: any, res: any) => {
  try {
    const db = getDb();
    const { id } = req.params;
    let tipo = (req.query.tipo || req.body?.tipo) as MeetingType;

    if (!tipo) {
      const consDoc = await db.doc(`atas/${id}`).get();
      if (consDoc.exists) {
        tipo = 'conselho';
      } else {
        const bispDoc = await db.doc(`conf/b/atas/${id}`).get();
        if (bispDoc.exists) {
          tipo = 'bispado';
        } else {
          return res.status(404).json({ error: 'Ata não encontrada.' });
        }
      }
    }

    if (tipo === 'bispado' && !req.user?.isBishopric) {
      return res.status(403).json({ error: 'Acesso restrito ao Bispado.' });
    }

    await db.doc(`${ataCol(tipo)}/${id}`).delete();
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Erro ao excluir ata.' });
  }
};

router.delete('/:id', authenticate, requireWrite, deleteMeetingHandler);
router.delete('/:id/discard', authenticate, requireWrite, deleteMeetingHandler);

export default router;
