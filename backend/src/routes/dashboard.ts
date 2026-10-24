import { Router } from 'express';
import { getDb } from '../config/firebase.js';
import { authenticate } from '../middlewares/auth.js';
import { Designacao, AgendaEvento, Ata, Pessoa, Atividade } from '../types/index.js';

const router = Router();

const pad = (n: number) => String(n).padStart(2, '0');
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const addDays = (isoDate: string, n: number) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};

const CH_FLOW = ['Indicado', 'Aprovação do bispado', 'Entrevista', 'Apoio na sacramental', 'Designação'];

// In-memory cache to save Firestore read quota and provide instant responses
let cachedResumoBisp: any = null;
let lastCacheTimeBisp = 0;
let cachedResumoCouncil: any = null;
let lastCacheTimeCouncil = 0;
const CACHE_TTL_MS = 20 * 1000; // 20 seconds cache

async function safeGetDocs(query: any): Promise<any[]> {
  try {
    const snap = await query.get();
    return snap.docs || [];
  } catch (err: any) {
    if (err.code === 8 || err.message?.includes('Quota exceeded')) {
      console.warn('⚠️ Firestore quota exceeded in dashboard query. Using safe fallback.');
    } else {
      console.warn('⚠️ Error in dashboard query:', err.message || err);
    }
    return [];
  }
}

router.get('/resumo', authenticate, async (req, res) => {
  const isBisp = req.user?.isBishopric ?? false;
  const now = Date.now();

  // Serve valid in-memory cache if fresh
  if (isBisp && cachedResumoBisp && (now - lastCacheTimeBisp < CACHE_TTL_MS)) {
    res.json(cachedResumoBisp);
    return;
  }
  if (!isBisp && cachedResumoCouncil && (now - lastCacheTimeCouncil < CACHE_TTL_MS)) {
    res.json(cachedResumoCouncil);
    return;
  }

  try {
    const db = getDb();
    const today = todayIso();
    const next7 = addDays(today, 7);
    const next30 = addDays(today, 30);

    const [conselhoDesigDocs, conselhoAtasDocs, agendaDocs, atividadesDocs, aprovDocs] = await Promise.all([
      safeGetDocs(db.collection('designacoes')),
      safeGetDocs(db.collection('atas')),
      safeGetDocs(db.collection('agenda')),
      safeGetDocs(db.collection('atividades')),
      safeGetDocs(db.collection('aprovacoes')),
    ]);

    const allDesig: Designacao[] = conselhoDesigDocs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      origem: 'conselho',
    })) as Designacao[];

    const allAtas: Ata[] = conselhoAtasDocs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      tipo: 'conselho',
    })) as Ata[];

    let pessoas: Pessoa[] = [];
    if (isBisp) {
      const [bispDesigDocs, bispAtasDocs, pessoasDocs] = await Promise.all([
        safeGetDocs(db.collection('conf/b/designacoes')),
        safeGetDocs(db.collection('conf/b/atas')),
        safeGetDocs(db.collection('conf/b/pessoas')),
      ]);

      bispDesigDocs.forEach(doc => {
        allDesig.push({ ...doc.data(), id: doc.id, origem: 'bispado' } as Designacao);
      });

      bispAtasDocs.forEach(doc => {
        allAtas.push({ ...doc.data(), id: doc.id, tipo: 'bispado' } as Ata);
      });

      pessoas = pessoasDocs.map(doc => ({ ...doc.data(), id: doc.id })) as Pessoa[];
    }

    const openTasks = allDesig.filter(d => d.status !== 'concluida');
    const lateTasks = openTasks.filter(d => d.prazo && d.prazo < today);
    const weekTasks = openTasks.filter(d => d.prazo && d.prazo >= today && d.prazo <= next7);

    // Agenda events
    const allEvents: AgendaEvento[] = agendaDocs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as AgendaEvento[];

    const events30 = allEvents.filter(e => e.data && e.data >= today && e.data <= next30);
    const events7 = events30.filter(e => e.data && e.data <= next7);

    // Live and last meeting
    const liveMeetings = allAtas.filter(a => a.status === 'aberta');
    const closedMeetings = allAtas
      .filter(a => a.status === 'encerrada')
      .sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));
    const lastAta = closedMeetings[0] || null;

    // Atividades aguardando
    const aprovMap: Record<string, string> = {};
    aprovDocs.forEach(d => {
      aprovMap[d.id] = d.data().status;
    });

    const pendingAtividadesCount = atividadesDocs.filter(doc => {
      const st = aprovMap[doc.id] || 'aguardando';
      return st === 'aguardando';
    }).length;

    // Chamados pipeline
    const chamadosAll = pessoas.filter(p => p.tipo === 'chamado');
    const chamadosOpen = chamadosAll.filter(p => p.status !== 'concluido');
    const chamadosFlow = chamadosOpen.filter(p => !p.detalhe || p.detalhe !== 'Desobrigação');
    const desobrigacoes = chamadosOpen.filter(p => p.detalhe === 'Desobrigação');
    const chamadosLate = chamadosOpen.filter(p => p.prazo && p.prazo < today).length;

    const pipelineCounts: Record<string, number> = {};
    CH_FLOW.forEach(stage => {
      pipelineCounts[stage] = chamadosOpen.filter(p => {
        const s = !p.detalhe || p.detalhe === 'Proposto' ? 'Indicado' : p.detalhe;
        return s === stage;
      }).length;
    });

    const result = {
      openTasksCount: openTasks.length,
      lateTasksCount: lateTasks.length,
      events30Count: events30.length,
      events7Count: events7.length,
      events7,
      attentionTasks: [...lateTasks, ...weekTasks].slice(0, 10),
      liveMeetings,
      lastAta,
      pendingAtividadesCount,
      chamados: isBisp
        ? {
            flowCount: chamadosFlow.length,
            desobrigacoesCount: desobrigacoes.length,
            lateCount: chamadosLate,
            pipelineCounts,
            items: chamadosOpen.slice(0, 10),
          }
        : null,
      pessoasAcompanhamentoCount: isBisp ? pessoas.filter(p => p.status !== 'concluido').length : null,
      pessoasVencidasCount: isBisp ? pessoas.filter(p => p.status !== 'concluido' && p.prazo && p.prazo < today).length : null,
    };

    if (isBisp) {
      cachedResumoBisp = result;
      lastCacheTimeBisp = now;
    } else {
      cachedResumoCouncil = result;
      lastCacheTimeCouncil = now;
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    const fallback = isBisp ? cachedResumoBisp : cachedResumoCouncil;
    if (fallback) {
      res.json(fallback);
      return;
    }

    res.json({
      openTasksCount: 0,
      lateTasksCount: 0,
      events30Count: 0,
      events7Count: 0,
      events7: [],
      attentionTasks: [],
      liveMeetings: [],
      lastAta: null,
      pendingAtividadesCount: 0,
      chamados: null,
      pessoasAcompanhamentoCount: null,
      pessoasVencidasCount: null,
    });
  }
});

export default router;
