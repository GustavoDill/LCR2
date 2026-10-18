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

router.get('/resumo', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const isBisp = req.user?.isBishopric ?? false;
    const today = todayIso();
    const next7 = addDays(today, 7);
    const next30 = addDays(today, 30);

    const [conselhoDesigSnap, conselhoAtasSnap, agendaSnap, atividadesSnap, aprovSnap] = await Promise.all([
      db.collection('designacoes').get(),
      db.collection('atas').get(),
      db.collection('agenda').get(),
      db.collection('atividades').get(),
      db.collection('aprovacoes').get(),
    ]);

    const allDesig: Designacao[] = conselhoDesigSnap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      origem: 'conselho',
    })) as Designacao[];

    const allAtas: Ata[] = conselhoAtasSnap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      tipo: 'conselho',
    })) as Ata[];

    let pessoas: Pessoa[] = [];
    if (isBisp) {
      const [bispDesigSnap, bispAtasSnap, pessoasSnap] = await Promise.all([
        db.collection('conf/b/designacoes').get(),
        db.collection('conf/b/atas').get(),
        db.collection('conf/b/pessoas').get(),
      ]);

      bispDesigSnap.docs.forEach(doc => {
        allDesig.push({ ...doc.data(), id: doc.id, origem: 'bispado' } as Designacao);
      });

      bispAtasSnap.docs.forEach(doc => {
        allAtas.push({ ...doc.data(), id: doc.id, tipo: 'bispado' } as Ata);
      });

      pessoas = pessoasSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Pessoa[];
    }

    const openTasks = allDesig.filter(d => d.status !== 'concluida');
    const lateTasks = openTasks.filter(d => d.prazo && d.prazo < today);
    const weekTasks = openTasks.filter(d => d.prazo && d.prazo >= today && d.prazo <= next7);

    // Agenda events
    const allEvents: AgendaEvento[] = agendaSnap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as AgendaEvento[];

    const events30 = allEvents.filter(e => e.data >= today && e.data <= next30);
    const events7 = events30.filter(e => e.data <= next7);

    // Live and last meeting
    const liveMeetings = allAtas.filter(a => a.status === 'aberta');
    const closedMeetings = allAtas
      .filter(a => a.status === 'encerrada')
      .sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));
    const lastAta = closedMeetings[0] || null;

    // Atividades aguardando
    const aprovMap: Record<string, string> = {};
    aprovSnap.docs.forEach(d => {
      aprovMap[d.id] = d.data().status;
    });

    const pendingAtividadesCount = atividadesSnap.docs.filter(doc => {
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

    res.json({
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
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Erro ao carregar resumo do painel.' });
  }
});

export default router;
