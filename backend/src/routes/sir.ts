import { Router } from 'express';
import { getDb } from '../config/firebase.js';
import { authenticate, requireBishopric, requireWrite } from '../middlewares/auth.js';
import { SIRRelatorio, SIREstaca } from '../types/index.js';

const router = Router();
router.use(authenticate, requireBishopric);

// Seed data from reference screenshot
export const SEED_SIR = {
  estacaSeminario: {
    id: 'estaca-seminario-2026-09-28',
    programa: 'seminario' as const,
    data: '2026-09-28',
    potencial: 248,
    matriculados: 60,
    anoAnterior: 52,
    meta: 0,
    alas: [
      { nome: 'Planaltina Ward', matriculados: 15, potencial: 42 },
      { nome: 'Petrópolis Ward', matriculados: 12, potencial: 38 },
      { nome: 'Marau Ward', matriculados: 9, potencial: 32 },
      { nome: 'Lagoa Vermelha Ward', matriculados: 7, potencial: 27 },
      { nome: 'Erechim 1st Ward', matriculados: 8, potencial: 38 },
      { nome: 'Bosque Ward', matriculados: 8, potencial: 57 },
      { nome: 'Erechim 2nd Branch', matriculados: 1, potencial: 14 },
    ],
    historico: { '2023': 48, '2024': 52, '2025': 55, '2026': 60 },
    importadoEm: Date.now(),
  },
  estacaInstituto: {
    id: 'estaca-instituto-2026-09-28',
    programa: 'instituto' as const,
    data: '2026-09-28',
    potencial: 800,
    matriculados: 36,
    anoAnterior: 34,
    meta: 2,
    alas: [
      { nome: 'Planaltina Ward', matriculados: 7, potencial: 110 },
      { nome: 'Petrópolis Ward', matriculados: 6, potencial: 105 },
      { nome: 'Marau Ward', matriculados: 5, potencial: 95 },
      { nome: 'Bosque Ward', matriculados: 8, potencial: 167 },
      { nome: 'Lagoa Vermelha Ward', matriculados: 4, potencial: 100 },
      { nome: 'Erechim 1st Ward', matriculados: 4, potencial: 125 },
      { nome: 'Erechim 2nd Branch', matriculados: 2, potencial: 98 },
    ],
    historico: { '2023': 30, '2024': 32, '2025': 34, '2026': 36 },
    importadoEm: Date.now(),
  },
  alunosRelatorio: {
    id: 'alunos-2026-10-09',
    data: '2026-10-09',
    semestre: '2º semestre 2026',
    importadoEm: Date.now(),
    alunos: [
      {
        nome: 'Leonardo Sodré Godinho',
        tipo: 'Instituto',
        situacao: 'risco' as const,
        freq: 0,
        leitura: 0,
        aulas: 6,
        avaliacao: 'Não Feita',
      },
      {
        nome: 'Deryck Emanuel Pinheiro Soares Lucio',
        tipo: 'Seminário',
        situacao: 'risco' as const,
        freq: 3,
        leitura: 0,
        aulas: 31,
        avaliacao: 'Não Feita',
      },
      {
        nome: 'Teylor Bruno Pinheiro Lucio',
        tipo: 'Seminário',
        situacao: 'risco' as const,
        freq: 3,
        leitura: 0,
        aulas: 31,
        avaliacao: 'Não Feita',
      },
      {
        nome: 'Nicholas Alexandre Rodrigues',
        tipo: 'Seminário',
        situacao: 'risco' as const,
        freq: 3,
        leitura: 0,
        aulas: 31,
        avaliacao: 'Não Feita',
      },
      {
        nome: 'Lucas Gabriel da Silva',
        tipo: 'Seminário',
        situacao: 'risco' as const,
        freq: 5,
        leitura: 0,
        aulas: 30,
        avaliacao: 'Não Feita',
      },
      {
        nome: 'Arthur Henrique Santos',
        tipo: 'Seminário',
        situacao: 'risco' as const,
        freq: 12,
        leitura: 15,
        aulas: 28,
        avaliacao: 'Não Feita',
      },
      {
        nome: 'Guilherme Alves Ferreira',
        tipo: 'Seminário',
        situacao: 'risco' as const,
        freq: 14,
        leitura: 20,
        aulas: 27,
        avaliacao: 'Não Feita',
      },
      {
        nome: 'Matheus Oliveira Costa',
        tipo: 'Seminário',
        situacao: 'pendencia' as const,
        freq: 30,
        leitura: 35,
        aulas: 22,
        avaliacao: 'Feita',
      },
      {
        nome: 'Amanda Beatriz Lima',
        tipo: 'Instituto',
        situacao: 'risco' as const,
        freq: 50,
        leitura: 30,
        aulas: 5,
        avaliacao: 'Não Feita',
      },
      {
        nome: 'Felipe Augusto Pereira',
        tipo: 'Instituto',
        situacao: 'risco' as const,
        freq: 60,
        leitura: 40,
        aulas: 4,
        avaliacao: 'Não Feita',
      },
      {
        nome: 'Gabriel Mendes Rocha',
        tipo: 'Instituto',
        situacao: 'pendencia' as const,
        freq: 98,
        leitura: 65,
        aulas: 1,
        avaliacao: 'Feita',
      },
      {
        nome: 'Juliana Cristine Ramos',
        tipo: 'Instituto',
        situacao: 'pendencia' as const,
        freq: 98,
        leitura: 65,
        aulas: 1,
        avaliacao: 'Feita',
      },
      {
        nome: 'Mariana Duarte Souza',
        tipo: 'Instituto',
        situacao: 'pendencia' as const,
        freq: 99,
        leitura: 70,
        aulas: 0,
        avaliacao: 'Feita',
      },
      {
        nome: 'Vinicius Ribeiro Moreira',
        tipo: 'Instituto',
        situacao: 'pendencia' as const,
        freq: 99,
        leitura: 70,
        aulas: 0,
        avaliacao: 'Feita',
      },
    ],
  },
};

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

    // Auto-seed if database has no SIR records yet
    if (alunos.length === 0 && estaca.seminario.length === 0 && estaca.instituto.length === 0) {
      await db.doc(`conf/b/sir/${SEED_SIR.alunosRelatorio.id}`).set(SEED_SIR.alunosRelatorio);
      await db.doc(`conf/b/sir/${SEED_SIR.estacaSeminario.id}`).set(SEED_SIR.estacaSeminario);
      await db.doc(`conf/b/sir/${SEED_SIR.estacaInstituto.id}`).set(SEED_SIR.estacaInstituto);

      alunos.push(SEED_SIR.alunosRelatorio as SIRRelatorio);
      estaca.seminario.push(SEED_SIR.estacaSeminario as SIREstaca);
      estaca.instituto.push(SEED_SIR.estacaInstituto as SIREstaca);
    }

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

router.post('/seed/force', requireWrite, async (req, res) => {
  try {
    const db = getDb();
    await db.doc(`conf/b/sir/${SEED_SIR.alunosRelatorio.id}`).set(SEED_SIR.alunosRelatorio);
    await db.doc(`conf/b/sir/${SEED_SIR.estacaSeminario.id}`).set(SEED_SIR.estacaSeminario);
    await db.doc(`conf/b/sir/${SEED_SIR.estacaInstituto.id}`).set(SEED_SIR.estacaInstituto);
    res.json({ success: true, seeded: SEED_SIR });
  } catch (error) {
    console.error('Error force seeding SIR:', error);
    res.status(500).json({ error: 'Erro ao popular dados do Seminário.' });
  }
});

export default router;
