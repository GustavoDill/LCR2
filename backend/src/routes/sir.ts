import { Router } from 'express';
import { getDb } from '../config/firebase.js';
import { authenticate, requireBishopric, requireWrite } from '../middlewares/auth.js';
import { SIRRelatorio, SIREstaca } from '../types/index.js';

const router = Router();
router.use(authenticate, requireBishopric);

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('conf/b/sir').get();

    const alunos: SIRRelatorio[] = [];
    const estaca: { seminario: SIREstaca[]; instituto: SIREstaca[] } = {
      seminario: [],
      instituto: [],
    };

    snap.docs.forEach(doc => {
      const data = doc.data();
      if (doc.id.startsWith('alunos-')) {
        alunos.push({ ...data, id: doc.id } as SIRRelatorio);
      } else if (doc.id.startsWith('estaca-')) {
        const prog = data.programa as 'seminario' | 'instituto';
        if (prog && estaca[prog]) {
          estaca[prog].push({ ...data, id: doc.id } as SIREstaca);
        }
      }
    });

    const sortByDate = (a: any, b: any) => String(b.data || '').localeCompare(String(a.data || ''));
    alunos.sort(sortByDate);
    estaca.seminario.sort(sortByDate);
    estaca.instituto.sort(sortByDate);

    res.json({ alunos, estaca });
  } catch (error) {
    console.error('Error fetching SIR data:', error);
    res.status(500).json({ error: 'Erro ao carregar dados do Seminário e Instituto.' });
  }
});

router.post('/alunos/import', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { data, semestre, alunos } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'Data do relatório é obrigatória.' });
    }
    if (!Array.isArray(alunos) || alunos.length === 0) {
      return res.status(400).json({ error: 'Nenhum aluno no relatório.' });
    }

    const docId = `alunos-${data}`;
    const report: SIRRelatorio = {
      id: docId,
      data,
      semestre: semestre || '',
      alunos,
      importadoEm: Date.now(),
    };

    await db.doc(`conf/b/sir/${docId}`).set(report);
    res.status(201).json(report);
  } catch (error) {
    console.error('Error importing SIR alunos:', error);
    res.status(500).json({ error: 'Erro ao importar relatório de alunos.' });
  }
});

router.post('/estaca', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { programa, data, potencial, matriculados, anoAnterior, meta, alas, historico } = req.body;

    if (!programa || (programa !== 'seminario' && programa !== 'instituto')) {
      return res.status(400).json({ error: 'Programa inválido.' });
    }
    if (!data) {
      return res.status(400).json({ error: 'Data da atualização é obrigatória.' });
    }

    const docId = `estaca-${programa}-${data}`;
    const estacaDoc: SIREstaca = {
      id: docId,
      programa,
      data,
      potencial: Number(potencial) || 0,
      matriculados: Number(matriculados) || 0,
      anoAnterior: Number(anoAnterior) || 0,
      meta: Number(meta) || 0,
      alas: alas || [],
      historico: historico || {},
      importadoEm: Date.now(),
    };

    await db.doc(`conf/b/sir/${docId}`).set(estacaDoc);
    res.status(201).json(estacaDoc);
  } catch (error) {
    console.error('Error saving SIR estaca numbers:', error);
    res.status(500).json({ error: 'Erro ao salvar números da estaca.' });
  }
});

router.delete('/:id', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    await db.doc(`conf/b/sir/${id}`).delete();
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting SIR report:', error);
    res.status(500).json({ error: 'Erro ao excluir relatório.' });
  }
});

export default router;
