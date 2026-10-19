import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { FinanceiroTrimestre, LancamentoFinanceiro, LinhaOrcamento } from '../types';
import { Icon } from '../components/Icons';

type StatusKey = 'exc' | 'bom' | 'norm' | 'crit';

const FST: Record<StatusKey, [string, string]> = {
  exc: ['Excelente', 'até 50%'],
  bom: ['Bom', '51% a 80%'],
  norm: ['Normal', '81% a 100%'],
  crit: ['Crítico', 'acima de 100%'],
};

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];
const MES3L = MESES.map(m => m.slice(0, 1).toUpperCase() + m.slice(1, 3));

const DEFAULT_ORGS: Omit<LinhaOrcamento, 'id'>[] = [
  { nome: 'Sociedade de Socorro', valor: 1500 },
  { nome: 'Quórum de Élderes', valor: 1500 },
  { nome: 'Rapazes', valor: 1600 },
  { nome: 'Moças', valor: 1600 },
  { nome: 'Primária', valor: 1400 },
  { nome: 'Jovens Adultos Solteiros', valor: 700 },
  { nome: 'Obra Missionária', valor: 400 },
  { nome: 'Seminário', valor: 500 },
  { nome: 'Festa de Natal da Ala', valor: 0 },
];

function generateLineId(name: string) {
  const slug = (name || 'linha')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);
  return `${slug || 'linha'}-${Math.random().toString(36).slice(2, 6)}`;
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const money = (v: number) => BRL.format(v || 0);
const kfmt = (v: number) =>
  Math.abs(v) >= 1000
    ? (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil'
    : Math.round(v).toLocaleString('pt-BR');

const getStatus = (pct: number): StatusKey => {
  if (pct > 100) return 'crit';
  if (pct > 80) return 'norm';
  if (pct > 50) return 'bom';
  return 'exc';
};

const formatDateBr = (dateStr: string) => {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

function perMesesTxt(p: string) {
  const parts = (p || '').split('-T');
  const t = Number(parts[1]) || 1;
  const m = (t - 1) * 3;
  return `${MESES[m]}, ${MESES[m + 1]} e ${MESES[m + 2]}`;
}

// SVG Circular Progress Ring
const Ring: React.FC<{ pct: number; st: StatusKey; txt?: string }> = ({ pct, st, txt }) => {
  const r = 24;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, pct || 0));
  const dash = (v / 100) * c;
  return (
    <svg className="ring" width="50" height="50" viewBox="0 0 62 62" aria-hidden="true">
      <circle className="rg-t" cx="31" cy="31" r={r} />
      <circle
        className={`rg-a b-${st}`}
        cx="31"
        cy="31"
        r={r}
        strokeDasharray={`${dash.toFixed(1)} ${c.toFixed(1)}`}
        transform="rotate(-90 31 31)"
      />
      <text x="31" y="35" textAnchor="middle" className="rg-x" dominantBaseline="middle">
        {txt || `${Math.round(pct || 0)}%`}
      </text>
    </svg>
  );
};

// SVG Compact Donut Chart
const Donut: React.FC<{ recebido: number; gasto: number; saldo: number }> = ({ recebido, gasto, saldo }) => {
  const r = 58;
  const c = 2 * Math.PI * r;
  const tot = Math.max(recebido, gasto, 1);
  const g = Math.min(gasto, tot) / tot;
  const ex = saldo < 0;
  const ga = (g * c).toFixed(1);
  const sa = ((1 - g) * c).toFixed(1);

  return (
    <svg width="160" height="160" viewBox="0 0 170 170" role="img" aria-label={`Gasto ${money(gasto)} e saldo ${money(saldo)}`}>
      <circle className="rg-t" cx="85" cy="85" r={r} style={{ strokeWidth: 20 }} />
      <circle
        className={`b-${ex ? 'crit' : 'norm'}`}
        cx="85"
        cy="85"
        r={r}
        fill="none"
        style={{ strokeWidth: 20 }}
        strokeDasharray={`${ga} ${c.toFixed(1)}`}
        transform="rotate(-90 85 85)"
      >
        <title>Gasto {money(gasto)}</title>
      </circle>
      {!ex && (
        <circle
          className="b-bom"
          cx="85"
          cy="85"
          r={r}
          fill="none"
          style={{ strokeWidth: 20 }}
          strokeDasharray={`${sa} ${c.toFixed(1)}`}
          strokeDashoffset={`-${ga}`}
          transform="rotate(-90 85 85)"
        >
          <title>Saldo {money(saldo)}</title>
        </circle>
      )}
      <text x="85" y="78" textAnchor="middle" className="dn-l">recebido</text>
      <text x="85" y="100" textAnchor="middle" className="dn-v">{kfmt(recebido)}</text>
    </svg>
  );
};

export const Financeiro: React.FC = () => {
  const { isBishopric, canWrite } = useAuth();
  const [orcamentos, setOrcamentos] = useState<Record<string, FinanceiroTrimestre>>({});
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: Trimestre, Visão anual, Lançamentos
  const [activeView, setActiveView] = useState<'tri' | 'ano' | 'lanc'>('tri');

  // Quarter navigation
  const today = new Date();
  const curPeriod = `${today.getFullYear()}-T${Math.floor(today.getMonth() / 3) + 1}`;
  const [selectedPeriod, setSelectedPeriod] = useState<string>(curPeriod);

  // Filter organization in quarterly view
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('todas');

  // Year view state
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [annualOrgFilter, setAnnualOrgFilter] = useState<string>('');

  // Lançamentos view filters
  const [flAno, setFlAno] = useState<string>('');
  const [flTri, setFlTri] = useState<string>('');
  const [flOrg, setFlOrg] = useState<string>('');
  const [flDe, setFlDe] = useState<string>('');
  const [flAte, setFlAte] = useState<string>('');
  const [flQuery, setFlQuery] = useState<string>('');
  const [flSort, setFlSort] = useState<'data' | 'valor'>('data');
  const [flDir, setFlDir] = useState<'asc' | 'desc'>('desc');

  // Expense modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingLancamentoId, setEditingLancamentoId] = useState<string | null>(null);
  const [expValor, setExpValor] = useState('');
  const [expLinha, setExpLinha] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expData, setExpData] = useState(today.toISOString().split('T')[0]);
  const [expNota, setExpNota] = useState('');
  const [expSolicitante, setExpSolicitante] = useState('');

  // Budget modal state
  interface BudgetLineInput {
    id: string;
    nome: string;
    valor: number | string;
  }
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [bgRec, setBgRec] = useState('');
  const [bgLinhas, setBgLinhas] = useState<BudgetLineInput[]>([]);

  useEffect(() => {
    loadFinData();
  }, [isBishopric]);

  async function loadFinData() {
    try {
      const res = await api.get<{ orcamentos: Record<string, FinanceiroTrimestre>; lancamentos: LancamentoFinanceiro[] }>('/financeiro/data');
      setOrcamentos(res.orcamentos || {});
      setLancamentos(res.lancamentos || []);
    } catch (err) {
      console.error('Erro ao carregar dados do financeiro:', err);
    } finally {
      setLoading(false);
    }
  }

  function shiftPeriod(delta: number) {
    const [y, t] = selectedPeriod.split('-T').map(Number);
    let nextT = t + delta;
    let nextY = y;
    if (nextT > 4) {
      nextT = 1;
      nextY++;
    } else if (nextT < 1) {
      nextT = 4;
      nextY--;
    }
    setSelectedPeriod(`${nextY}-T${nextT}`);
    setSelectedOrgFilter('todas');
  }

  function openNewExpenseModal(preLinha?: string) {
    const curBudget = orcamentos[selectedPeriod];
    const defaultLinha = preLinha || curBudget?.linhas?.[0]?.id || '';
    setEditingLancamentoId(null);
    setExpLinha(defaultLinha);
    setExpValor('');
    setExpDesc('');
    setExpData(today.toISOString().split('T')[0]);
    setExpNota('');
    setExpSolicitante('');
    setIsExpenseModalOpen(true);
  }

  function openEditExpenseModal(l: LancamentoFinanceiro) {
    setEditingLancamentoId(l.id);
    setExpLinha(l.linha);
    setExpValor(l.valor ? l.valor.toFixed(2).replace('.', ',') : '');
    setExpDesc(l.descricao || '');
    setExpData(l.data || today.toISOString().split('T')[0]);
    setExpNota(l.nota || '');
    setExpSolicitante(l.solicitante || '');
    setIsExpenseModalOpen(true);
  }

  async function handleDeleteExpense(id: string) {
    if (!confirm('Deseja realmente excluir este lançamento?')) return;
    try {
      await api.delete(`/financeiro/lancamentos/${id}`);
      setIsExpenseModalOpen(false);
      loadFinData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir despesa');
    }
  }

  function openBudgetModal() {
    const curBudget = orcamentos[selectedPeriod];
    setBgRec(curBudget ? String(curBudget.recebido) : '9600');
    setBgLinhas(
      curBudget?.linhas?.length
        ? curBudget.linhas.map(l => ({ id: l.id, nome: l.nome, valor: l.valor }))
        : DEFAULT_ORGS.map(o => ({ id: generateLineId(o.nome), nome: o.nome, valor: o.valor }))
    );
    setIsBudgetModalOpen(true);
  }

  function addBudgetLine() {
    setBgLinhas(prev => [...prev, { id: generateLineId('Nova categoria'), nome: '', valor: '' }]);
  }

  function removeBudgetLine(id: string) {
    const line = bgLinhas.find(l => l.id === id);
    if (!line) return;
    const hasExpenses = currentLancamentos.some(l => l.linha === id);
    if (hasExpenses) {
      if (!confirm(`A organização "${line.nome || 'sem nome'}" possui despesas lançadas neste trimestre. Deseja realmente removê-la do orçamento?`)) {
        return;
      }
    }
    setBgLinhas(prev => prev.filter(l => l.id !== id));
  }

  function updateBudgetLine(id: string, field: 'nome' | 'valor', val: any) {
    setBgLinhas(prev =>
      prev.map(l => {
        if (l.id !== id) return l;
        return { ...l, [field]: val };
      })
    );
  }

  async function handleExpenseSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(expValor.replace(/\./g, '').replace(',', '.'));
    if (!val || val <= 0) return alert('Informe um valor válido maior que zero.');

    try {
      if (editingLancamentoId) {
        await api.put(`/financeiro/lancamentos/${editingLancamentoId}`, {
          linha: expLinha,
          valor: val,
          descricao: expDesc,
          data: expData,
          nota: expNota,
          solicitante: expSolicitante,
        });
      } else {
        await api.post('/financeiro/lancamentos', {
          periodo: selectedPeriod,
          linha: expLinha,
          valor: val,
          descricao: expDesc,
          data: expData,
          nota: expNota,
          solicitante: expSolicitante,
        });
      }
      setIsExpenseModalOpen(false);
      loadFinData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar despesa');
    }
  }

  async function handleBudgetSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rec = parseFloat(bgRec.replace(/\./g, '').replace(',', '.'));
    if (isNaN(rec)) return alert('Informe o valor recebido.');

    const cleanLines: LinhaOrcamento[] = bgLinhas
      .filter(l => l.nome.trim() !== '')
      .map(l => ({
        id: l.id,
        nome: l.nome.trim(),
        valor: typeof l.valor === 'number'
          ? l.valor
          : parseFloat(String(l.valor).replace(/\./g, '').replace(',', '.')) || 0,
      }));

    if (!cleanLines.length) return alert('Adicione pelo menos uma organização.');

    try {
      await api.post('/financeiro/budget', {
        periodo: selectedPeriod,
        recebido: rec,
        linhas: cleanLines,
      });
      setIsBudgetModalOpen(false);
      loadFinData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar orçamento');
    }
  }

  async function handleDownloadCSV() {
    try {
      const blob = await api.get<Blob>('/financeiro/export/csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lancamentos-financeiros-${today.getFullYear()}.csv`;
      a.click();
    } catch (err: any) {
      alert(err.message || 'Erro ao exportar CSV');
    }
  }

  // Quarter calculations
  const [curYear, curTri] = selectedPeriod.split('-T').map(Number);
  const currentBudget = orcamentos[selectedPeriod];
  const currentLancamentos = lancamentos.filter(l => l.periodo === selectedPeriod);

  const orgNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    Object.values(orcamentos).forEach(orc => {
      (orc.linhas || []).forEach(l => {
        map[l.id] = l.nome;
      });
    });
    return map;
  }, [orcamentos]);

  const lineName = (linhaId: string) => orgNameMap[linhaId] || 'Linha removida';

  const totalRecebido = currentBudget ? currentBudget.recebido : 0;
  const orgTotals: Record<string, number> = {};
  currentLancamentos.forEach(l => {
    orgTotals[l.linha] = (orgTotals[l.linha] || 0) + (l.valor || 0);
  });

  const linesWithSpending = useMemo(() => {
    const lines = [...(currentBudget?.linhas || [])];
    Object.keys(orgTotals).forEach(id => {
      if (!lines.some(l => l.id === id)) {
        lines.push({ id, nome: orgNameMap[id] || 'Linha removida', valor: 0, orfa: true });
      }
    });
    return lines.map(l => {
      const gasto = orgTotals[l.id] || 0;
      const orc = l.valor || 0;
      const saldo = orc - gasto;
      const pct = orc > 0 ? (gasto / orc) * 100 : gasto > 0 ? 100 : 0;
      const st = orc <= 0 && gasto > 0 ? 'crit' : getStatus(pct);
      return { ...l, orc, gasto, saldo, pct, st };
    });
  }, [currentBudget, orgTotals, orgNameMap]);

  const totalDistribuido = linesWithSpending.reduce((s, l) => s + l.orc, 0);
  const totalGasto = currentLancamentos.reduce((s, l) => s + (l.valor || 0), 0);
  const saldoDisponivel = totalRecebido - totalGasto;
  const pctGasto = totalRecebido ? Math.round((totalGasto / totalRecebido) * 100) : 0;
  const salPct = totalRecebido ? Math.max(0, saldoDisponivel) / totalRecebido * 100 : 0;
  const dentroDoOrcamento = linesWithSpending.filter(l => l.st !== 'crit').length;
  const maiorGastoLinha = [...linesWithSpending].sort((a, b) => b.gasto - a.gasto)[0];

  const situacaoCounts = useMemo(() => {
    const res: Record<StatusKey, { count: number; gasto: number }> = {
      exc: { count: 0, gasto: 0 },
      bom: { count: 0, gasto: 0 },
      norm: { count: 0, gasto: 0 },
      crit: { count: 0, gasto: 0 },
    };
    linesWithSpending.forEach(l => {
      res[l.st].count++;
      res[l.st].gasto += l.gasto;
    });
    return res;
  }, [linesWithSpending]);

  // Quarterly expenses filtered by selected organization
  const filteredQuarterLancamentos = useMemo(() => {
    if (selectedOrgFilter === 'todas') return currentLancamentos;
    return currentLancamentos.filter(l => l.linha === selectedOrgFilter);
  }, [currentLancamentos, selectedOrgFilter]);

  // Annual data calculations
  const annualData = useMemo(() => {
    const qList = [1, 2, 3, 4].map(t => {
      const p = `${selectedYear}-T${t}`;
      const orc = orcamentos[p];
      const rec = orc ? orc.recebido : 0;
      const gasto = lancamentos.filter(l => l.periodo === p).reduce((s, l) => s + (l.valor || 0), 0);
      return { p, t, rec, gasto, saldo: rec - gasto };
    });

    const yearLancamentos = lancamentos.filter(l => String(l.periodo || '').startsWith(`${selectedYear}-`));
    const monthlyGasto = new Array(12).fill(0);
    yearLancamentos.forEach(l => {
      const m = parseInt(String(l.data || '').slice(5, 7), 10);
      if (m >= 1 && m <= 12) {
        monthlyGasto[m - 1] += l.valor || 0;
      }
    });

    let acc = 0;
    const accumulated = qList.map(q => {
      acc += q.rec - q.gasto;
      return acc;
    });

    const uniqueOrgs = Array.from(
      new Set(
        qList.flatMap(q => {
          const bg = orcamentos[q.p];
          return bg ? bg.linhas.map(l => l.nome) : [];
        })
      )
    ).sort();

    const totalRec = qList.reduce((s, q) => s + q.rec, 0);
    const totalGastoAno = qList.reduce((s, q) => s + q.gasto, 0);

    const biggestByOrg: Record<string, number> = {};
    yearLancamentos.forEach(l => {
      const name = lineName(l.linha);
      biggestByOrg[name] = (biggestByOrg[name] || 0) + (l.valor || 0);
    });
    const topOrg = Object.entries(biggestByOrg).sort((a, b) => b[1] - a[1])[0];

    return {
      qList,
      yearLancamentos,
      monthlyGasto,
      accumulated,
      uniqueOrgs,
      totalRec,
      totalGastoAno,
      annualSaldo: totalRec - totalGastoAno,
      topOrgName: topOrg ? topOrg[0] : null,
      topLancamentos: [...yearLancamentos].sort((a, b) => (b.valor || 0) - (a.valor || 0)).slice(0, 6),
    };
  }, [selectedYear, orcamentos, lancamentos, orgNameMap]);

  // Set default annual org
  useEffect(() => {
    if (annualData.uniqueOrgs.length && (!annualOrgFilter || !annualData.uniqueOrgs.includes(annualOrgFilter))) {
      setAnnualOrgFilter(annualData.uniqueOrgs[0]);
    }
  }, [annualData.uniqueOrgs, annualOrgFilter]);

  // Lançamentos view calculations
  const allYears = useMemo(() => {
    const years = new Set<number>([today.getFullYear()]);
    lancamentos.forEach(l => {
      const y = parseInt(l.periodo?.split('-T')[0] || '', 10);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [lancamentos]);

  const allOrgsInLancamentos = useMemo(() => {
    const orgs = new Set<string>();
    lancamentos.forEach(l => {
      orgs.add(lineName(l.linha));
    });
    return Array.from(orgs).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [lancamentos, orgNameMap]);

  const filteredLancamentosList = useMemo(() => {
    return lancamentos
      .filter(l => {
        const [y, t] = (l.periodo || '').split('-T').map(Number);
        if (flAno && y !== Number(flAno)) return false;
        if (flTri && t !== Number(flTri)) return false;
        const orgNome = lineName(l.linha);
        if (flOrg && orgNome !== flOrg) return false;
        if (flDe && l.data < flDe) return false;
        if (flAte && l.data > flAte) return false;
        if (flQuery) {
          const qLower = flQuery.toLowerCase();
          const matchDesc = (l.descricao || '').toLowerCase().includes(qLower);
          const matchNota = (l.nota || '').toLowerCase().includes(qLower);
          const matchSol = (l.solicitante || '').toLowerCase().includes(qLower);
          const matchOrg = orgNome.toLowerCase().includes(qLower);
          if (!matchDesc && !matchNota && !matchSol && !matchOrg) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (flSort === 'valor') {
          const diff = (a.valor || 0) - (b.valor || 0);
          return flDir === 'asc' ? diff : -diff;
        }
        const diff = (a.data || '').localeCompare(b.data || '');
        return flDir === 'asc' ? diff : -diff;
      });
  }, [lancamentos, flAno, flTri, flOrg, flDe, flAte, flQuery, flSort, flDir, orgNameMap]);

  const flStats = useMemo(() => {
    const count = filteredLancamentosList.length;
    const total = filteredLancamentosList.reduce((s, l) => s + (l.valor || 0), 0);
    const avg = count ? total / count : 0;
    const max = count ? Math.max(...filteredLancamentosList.map(l => l.valor || 0)) : 0;

    const rankingMap: Record<string, number> = {};
    filteredLancamentosList.forEach(l => {
      const n = lineName(l.linha);
      rankingMap[n] = (rankingMap[n] || 0) + (l.valor || 0);
    });
    const ranking = Object.entries(rankingMap).sort((a, b) => b[1] - a[1]);

    return { count, total, avg, max, ranking };
  }, [filteredLancamentosList, orgNameMap]);

  if (!isBishopric) {
    return <div className="notice bisp">Acesso restrito aos membros do Bispado.</div>;
  }

  if (loading) {
    return <div className="empty">Carregando financeiro da ala…</div>;
  }

  const isCurrentPeriod = selectedPeriod === curPeriod;

  return (
    <div className="stack">
      {/* Header */}
      <div className="head">
        <div>
          <h2>Financeiro</h2>
          <p className="sub">
            {activeView === 'tri' && 'Os valores da Igreja chegam por trimestre, e cada despesa é lançada no trimestre a que pertence. Somente o bispado vê esta página.'}
            {activeView === 'ano' && 'Visão geral do ano: quanto entrou, quanto foi gasto e como cada organização usou o orçamento. Somente o bispado vê esta página.'}
            {activeView === 'lanc' && 'Todos os lançamentos, com filtros por data, trimestre e organização. Somente o bispado vê esta página.'}
          </p>
        </div>

        {activeView === 'tri' && (
          <div className="mnav">
            <button type="button" className="btn sm" onClick={() => shiftPeriod(-1)} aria-label="Trimestre anterior">
              ‹
            </button>
            <span className="m">
              {curTri}º tri {curYear}
              <small style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: 'var(--muted)' }}>
                {perMesesTxt(selectedPeriod)}
              </small>
            </span>
            <button type="button" className="btn sm" onClick={() => shiftPeriod(1)} aria-label="Próximo trimestre">
              ›
            </button>
          </div>
        )}

        {activeView === 'ano' && (
          <div className="mnav">
            <button type="button" className="btn sm" onClick={() => setSelectedYear(y => y - 1)} aria-label="Ano anterior">
              ‹
            </button>
            <span className="m">{selectedYear}</span>
            <button type="button" className="btn sm" onClick={() => setSelectedYear(y => y + 1)} aria-label="Próximo ano">
              ›
            </button>
          </div>
        )}
      </div>

      {/* Main navigation tabs */}
      <div className="seg" role="tablist" aria-label="Visões do financeiro">
        <button
          type="button"
          className={activeView === 'tri' ? 'on' : ''}
          onClick={() => setActiveView('tri')}
        >
          <Icon name="wallet" /> Trimestre
        </button>
        <button
          type="button"
          className={activeView === 'ano' ? 'on' : ''}
          onClick={() => setActiveView('ano')}
        >
          <Icon name="bars" /> Visão anual
        </button>
        <button
          type="button"
          className={activeView === 'lanc' ? 'on' : ''}
          onClick={() => setActiveView('lanc')}
        >
          <Icon name="receipt" /> Lançamentos ({lancamentos.length})
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. ABA TRIMESTRE                                          */}
      {/* ========================================================= */}
      {activeView === 'tri' && (
        <>
          <div className={`notice ${isCurrentPeriod ? 'bisp' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span>
              <b>{curTri}º trimestre de {curYear}</b> · {perMesesTxt(selectedPeriod)}
              {isCurrentPeriod ? ' · trimestre atual' : ''}
            </span>
            {!isCurrentPeriod && (
              <button type="button" className="btn sm" onClick={() => setSelectedPeriod(curPeriod)}>
                Voltar ao trimestre atual ({curPeriod.split('-T')[1]}º tri {curPeriod.split('-T')[0]})
              </button>
            )}
          </div>

          <div className="btns">
            {canWrite && (
              <>
                <button type="button" className="btn bisp" onClick={() => openNewExpenseModal()}>
                  + Lançar despesa
                </button>
                <button type="button" className="btn" onClick={openBudgetModal}>
                  Editar orçamento
                </button>
              </>
            )}
            <button type="button" className="btn ghost" onClick={handleDownloadCSV}>
              Exportar CSV
            </button>
          </div>

          {/* KPI Cards com anéis de progresso circulares */}
          <div className="kgrid">
            <div className="kcard">
              <h4>Recebido no trimestre</h4>
              <div className="kbody">
                <span className="kval">{money(totalRecebido)}</span>
              </div>
              <div className="ksub">
                {totalRecebido === totalDistribuido
                  ? 'todo o valor distribuído'
                  : totalRecebido > totalDistribuido
                  ? `${money(totalRecebido - totalDistribuido)} sem destino`
                  : `${money(totalDistribuido - totalRecebido)} distribuído a mais`}
              </div>
            </div>

            <div className="kcard">
              <h4>Uso do orçamento</h4>
              <div className="kbody">
                <Ring pct={pctGasto} st={getStatus(pctGasto)} />
                <span className="kval">{money(totalGasto)}</span>
              </div>
              <div className={`ksub s-${getStatus(pctGasto)}`}>
                {FST[getStatus(pctGasto)][0]} · gasto do recebido
              </div>
            </div>

            <div className="kcard">
              <h4>Saldo disponível</h4>
              <div className="kbody">
                <Ring pct={salPct} st={saldoDisponivel < 0 ? 'crit' : 'bom'} />
                <span className={`kval ${saldoDisponivel < 0 ? 's-crit' : 's-bom'}`}>
                  {money(saldoDisponivel)}
                </span>
              </div>
              <div className={`ksub ${saldoDisponivel < 0 ? 's-crit' : 's-bom'}`}>
                {saldoDisponivel < 0 ? 'acima do recebido' : 'do valor recebido'}
              </div>
            </div>

            <div className="kcard">
              <h4>Dentro do orçamento</h4>
              <div className="kbody">
                <Ring
                  pct={linesWithSpending.length ? (dentroDoOrcamento / linesWithSpending.length) * 100 : 0}
                  st={dentroDoOrcamento === linesWithSpending.length ? 'exc' : 'crit'}
                  txt={`${dentroDoOrcamento}/${linesWithSpending.length}`}
                />
                <span className="kval">
                  {dentroDoOrcamento} de {linesWithSpending.length}
                </span>
              </div>
              <div className={`ksub ${dentroDoOrcamento === linesWithSpending.length ? 's-exc' : 's-crit'}`}>
                {dentroDoOrcamento === linesWithSpending.length
                  ? 'nenhuma acima do orçado'
                  : `${linesWithSpending.length - dentroDoOrcamento} acima do orçado`}
              </div>
            </div>

            <div className="kcard">
              <h4>Lançamentos</h4>
              <div className="kbody">
                <span className="kval">{currentLancamentos.length}</span>
              </div>
              <div className="ksub">
                média de {money(currentLancamentos.length ? totalGasto / currentLancamentos.length : 0)}
              </div>
            </div>

            <div className="kcard">
              <h4>Maior gasto</h4>
              <div className="kbody">
                <span className="kval" style={{ fontSize: 17 }}>
                  {maiorGastoLinha && maiorGastoLinha.gasto > 0 ? maiorGastoLinha.nome : '—'}
                </span>
              </div>
              <div className="ksub">
                {maiorGastoLinha && maiorGastoLinha.gasto > 0
                  ? `${money(maiorGastoLinha.gasto)} · ${Math.round(maiorGastoLinha.pct)}% do orçado`
                  : 'nenhum lançamento'}
              </div>
            </div>
          </div>

          {/* Grid Principal: Tabela Limpa + Donut Compacto */}
          <div className="g21">
            {/* Lado Esquerdo: Detalhamento por organização limpo e objetivo */}
            <section className="card">
              <div className="head" style={{ marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>Detalhamento por organização</h3>
                <span className="row-m">Toque no nome para filtrar</span>
              </div>

              {linesWithSpending.length ? (
                <div className="tscroll">
                  <table className="dtbl">
                    <thead>
                      <tr>
                        <th>Organização</th>
                        <th className="n">Orçado</th>
                        <th className="n">Gasto</th>
                        <th className="n">Saldo</th>
                        <th>Uso</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {linesWithSpending.map(r => {
                        const isSelected = selectedOrgFilter === r.id;
                        return (
                          <tr key={r.id} className={isSelected ? 'sel' : ''}>
                            <td>
                              <button
                                type="button"
                                className="dlink"
                                onClick={() => setSelectedOrgFilter(isSelected ? 'todas' : r.id)}
                                title="Filtrar lançamentos desta organização"
                              >
                                <span className={`dot s-${r.st}`} />
                                {r.nome}
                              </button>
                            </td>
                            <td className="n">{money(r.orc)}</td>
                            <td className="n" style={{ fontWeight: 700 }}>
                              {money(r.gasto)}
                            </td>
                            <td className={`n ${r.saldo < 0 ? 's-crit' : 's-bom'}`}>
                              {money(r.saldo)}
                            </td>
                            <td>
                              <span className="ubar">
                                <s>
                                  <i
                                    className={`b-${r.st}`}
                                    style={{ width: `${Math.min(100, Math.max(0, r.pct))}%` }}
                                  />
                                </s>
                                <b className={`s-${r.st}`}>
                                  {r.orc > 0 ? `${Math.round(r.pct)}%` : r.gasto > 0 ? '100%+' : '0%'}
                                </b>
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {canWrite && !r.orfa && (
                                <button
                                  type="button"
                                  className="btn ghost sm"
                                  onClick={() => openNewExpenseModal(r.id)}
                                >
                                  + Lançar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td>Total</td>
                        <td className="n">{money(totalDistribuido)}</td>
                        <td className="n">{money(totalGasto)}</td>
                        <td className={`n ${saldoDisponivel < 0 ? 's-crit' : 's-bom'}`}>
                          {money(saldoDisponivel)}
                        </td>
                        <td colSpan={2}>
                          {totalDistribuido ? Math.round((totalGasto / totalDistribuido) * 100) : 0}% do distribuído
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="empty">Nenhuma linha de orçamento definida para este trimestre.</div>
              )}
            </section>

            {/* Lado Direito: Situação do trimestre com Donut compacto */}
            <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="head">
                <h3 style={{ margin: 0 }}>Situação do trimestre</h3>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                <Donut recebido={totalRecebido} gasto={totalGasto} saldo={saldoDisponivel} />
              </div>

              <div className="legend" style={{ justifyContent: 'center' }}>
                <span>
                  <i className="lg-gas" /> Gasto {money(totalGasto)}
                </span>
                <span>
                  <i className={saldoDisponivel < 0 ? 'lg-crit' : 'lg-rec'} />
                  {saldoDisponivel < 0 ? 'Excedente' : 'Saldo'} {money(Math.abs(saldoDisponivel))}
                </span>
              </div>

              <table className="sttbl">
                <thead>
                  <tr>
                    <th>Situação</th>
                    <th className="n">Org.</th>
                    <th className="n">Gasto</th>
                  </tr>
                </thead>
                <tbody>
                  {(['exc', 'bom', 'norm', 'crit'] as StatusKey[]).map(k => (
                    <tr key={k}>
                      <td>
                        <span className={`dot s-${k}`} />
                        {FST[k][0]} <small style={{ color: 'var(--muted)' }}>{FST[k][1]}</small>
                      </td>
                      <td className="n">{situacaoCounts[k].count}</td>
                      <td className="n">{money(situacaoCounts[k].gasto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          {/* Lançamentos do Trimestre com Filtro Rápido */}
          <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="head">
              <h3 style={{ margin: 0 }}>
                Lançamentos {selectedOrgFilter !== 'todas' ? `· ${lineName(selectedOrgFilter)}` : ''}
              </h3>
              {selectedOrgFilter !== 'todas' && (
                <button type="button" className="btn ghost sm" onClick={() => setSelectedOrgFilter('todas')}>
                  Mostrar todas
                </button>
              )}
            </div>

            {/* Chips de filtro por organização */}
            {linesWithSpending.length > 0 && (
              <div className="chips">
                <button
                  type="button"
                  className={`chip ${selectedOrgFilter === 'todas' ? 'on' : ''}`}
                  onClick={() => setSelectedOrgFilter('todas')}
                >
                  Todas ({currentLancamentos.length})
                </button>
                {linesWithSpending
                  .filter(l => orgTotals[l.id] > 0)
                  .map(l => (
                    <button
                      key={l.id}
                      type="button"
                      className={`chip ${selectedOrgFilter === l.id ? 'on' : ''}`}
                      onClick={() => setSelectedOrgFilter(l.id)}
                    >
                      {l.nome} ({currentLancamentos.filter(x => x.linha === l.id).length})
                    </button>
                  ))}
              </div>
            )}

            {filteredQuarterLancamentos.length ? (
              <div className="list">
                {filteredQuarterLancamentos.map(l => (
                  <div key={l.id} className="row">
                    <div className="row-main">
                      <div className="row-t">{l.descricao}</div>
                      <div className="row-m">
                        <span className="tag tag-bispado">{lineName(l.linha)}</span>
                        <span>{formatDateBr(l.data)}</span>
                        {l.nota && <span>Nota {l.nota}</span>}
                        {l.solicitante && <span>{l.solicitante}</span>}
                      </div>
                    </div>
                    <div className="acts">
                      <span className="money">{money(l.valor)}</span>
                      {canWrite && (
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => openEditExpenseModal(l)}
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">Nenhuma despesa lançada neste trimestre.</div>
            )}

            <div className="lanc-tot">
              <span>Total exibido</span>
              <span className="money">
                {money(filteredQuarterLancamentos.reduce((s, l) => s + (l.valor || 0), 0))}
              </span>
            </div>
          </section>
        </>
      )}

      {/* ========================================================= */}
      {/* 2. ABA VISÃO ANUAL                                        */}
      {/* ========================================================= */}
      {activeView === 'ano' && (
        <>
          {/* KPI Tiles Anuais */}
          <div className="ktiles">
            <div className="ktile rec">
              <div>
                <small>Recebido no ano</small>
                <b>{money(annualData.totalRec)}</b>
              </div>
              <span>{annualData.qList.filter(q => q.rec > 0).length} de 4 trimestres</span>
            </div>

            <div className="ktile rec">
              <div>
                <small>Recebido no 4º trimestre</small>
                <b>{money(annualData.qList[3]?.rec || 0)}</b>
              </div>
              <span>out, nov, dez</span>
            </div>

            <div className="ktile gas">
              <div>
                <small>Gasto no ano</small>
                <b>{money(annualData.totalGastoAno)}</b>
              </div>
              <span>
                {annualData.totalRec ? Math.round((annualData.totalGastoAno / annualData.totalRec) * 100) : 0}% do recebido
                <br />
                {annualData.yearLancamentos.length} lançamentos
              </span>
            </div>

            <div className={`ktile ${annualData.annualSaldo < 0 ? 'crit' : 'rec'}`}>
              <div>
                <small>Saldo do ano</small>
                <b>{money(annualData.annualSaldo)}</b>
              </div>
              <span>{annualData.topOrgName ? `maior gasto: ${annualData.topOrgName}` : ''}</span>
            </div>
          </div>

          {/* Gráfico 1: Recebido x Gasto por Trimestre (Barras Gasto + Linha Recebido) */}
          <section className="card">
            <div className="head" style={{ marginBottom: 6 }}>
              <h3 style={{ margin: 0 }}>Recebido x gasto por trimestre</h3>
              <div className="legend">
                <span><i className="lg-gas" /> Gasto</span>
                <span><i className="lg-rec" /> Recebido</span>
              </div>
            </div>

            <div className="fa-chart">
              {(() => {
                const W = 720;
                const H = 240;
                const ml = 24;
                const mr = 24;
                const mt = 32;
                const mb = 32;
                const iw = W - ml - mr;
                const ih = H - mt - mb;
                const n = 4;
                const bw = Math.min(60, (iw / n) * 0.42);
                const maxVal = Math.max(1, ...annualData.qList.map(q => Math.max(q.rec, q.gasto))) * 1.15;

                const X = (i: number) => ml + (iw / n) * (i + 0.5);
                const Y_ = (v: number) => mt + ih - (v / maxVal) * ih;

                const pts = annualData.qList.map((q, i) => `${X(i)},${Y_(q.rec)}`).join(' L');

                return (
                  <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Recebido e gasto por trimestre">
                    {/* Linha base */}
                    <line className="fa-base" x1={ml} x2={W - mr} y1={mt + ih} y2={mt + ih} />

                    {/* Barras de Gasto */}
                    {annualData.qList.map((q, i) => {
                      const h = (q.gasto / maxVal) * ih;
                      return (
                        <g key={q.t}>
                          <rect
                            className="fa-bar"
                            x={X(i) - bw / 2}
                            y={mt + ih - h}
                            width={bw}
                            height={Math.max(h, q.gasto ? 2 : 0)}
                            rx={5}
                          >
                            <title>{q.t}º tri · gasto {money(q.gasto)}</title>
                          </rect>
                          {q.gasto > 0 && (
                            <text className="fa-vg" x={X(i)} y={mt + ih - h - 6} textAnchor="middle">
                              {kfmt(q.gasto)}
                            </text>
                          )}
                          <text className="fa-x" x={X(i)} y={H - 8} textAnchor="middle">
                            {q.t}º tri
                          </text>
                        </g>
                      );
                    })}

                    {/* Linha de Recebido */}
                    {annualData.qList.some(q => q.rec > 0) && (
                      <path className="fa-line" d={`M${pts}`} />
                    )}

                    {/* Pontos de Recebido */}
                    {annualData.qList.map((q, i) => {
                      const x = X(i);
                      const y = Y_(q.rec);
                      return (
                        <g key={`pt-${q.t}`}>
                          <circle className="fa-pt" cx={x} cy={y} r={4.5}>
                            <title>{q.t}º tri · recebido {money(q.rec)}</title>
                          </circle>
                          {q.rec > 0 && (
                            <text className="fa-vr" x={x} y={y - 9} textAnchor="middle">
                              {kfmt(q.rec)}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}
            </div>
          </section>

          {/* Grid de Gráficos: Gastos por mês + Saldo acumulado */}
          <div className="grid2">
            {/* Gráfico 2: Gastos por mês */}
            <section className="card">
              <div className="head" style={{ marginBottom: 6 }}>
                <h3 style={{ margin: 0 }}>Gastos por mês</h3>
                <span className="row-m">pela data da nota</span>
              </div>

              <div className="fa-chart">
                {(() => {
                  const W = 460;
                  const H = 210;
                  const ml = 12;
                  const mr = 12;
                  const mt = 24;
                  const mb = 26;
                  const iw = W - ml - mr;
                  const ih = H - mt - mb;
                  const n = 12;
                  const bw = Math.min(24, (iw / n) * 0.65);
                  const maxMes = Math.max(1, ...annualData.monthlyGasto) * 1.15;
                  const X = (i: number) => ml + (iw / n) * (i + 0.5);

                  return (
                    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gastos por mês">
                      <line className="fa-base" x1={ml} x2={W - mr} y1={mt + ih} y2={mt + ih} />
                      {annualData.monthlyGasto.map((v, i) => {
                        const h = (v / maxMes) * ih;
                        return (
                          <g key={i}>
                            <rect
                              className="fa-bar"
                              x={X(i) - bw / 2}
                              y={mt + ih - h}
                              width={bw}
                              height={Math.max(h, v ? 2 : 0)}
                              rx={3}
                            >
                              <title>{MESES[i]} · {money(v)}</title>
                            </rect>
                            {v > 0 && (
                              <text className="fa-vg" x={X(i)} y={mt + ih - h - 5} textAnchor="middle" style={{ fontSize: 9.5 }}>
                                {kfmt(v)}
                              </text>
                            )}
                            <text className="fa-x" x={X(i)} y={H - 8} textAnchor="middle" style={{ fontSize: 11 }}>
                              {MES3L[i]}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>
            </section>

            {/* Gráfico 3: Saldo acumulado no ano */}
            <section className="card">
              <div className="head" style={{ marginBottom: 6 }}>
                <h3 style={{ margin: 0 }}>Saldo acumulado no ano</h3>
                <span className="row-m">recebido menos gasto</span>
              </div>

              <div className="fa-chart">
                {(() => {
                  const W = 460;
                  const H = 210;
                  const lw = 50;
                  const vw = 100;
                  const iw = W - lw - vw;
                  const rh = (H - 12) / 4;
                  const maxAbs = Math.max(1, ...annualData.accumulated.map(Math.abs));

                  return (
                    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Saldo acumulado por trimestre">
                      {annualData.accumulated.map((v, i) => {
                        const y = 8 + i * rh;
                        const w = (Math.abs(v) / maxAbs) * iw;
                        return (
                          <g key={i}>
                            <text className="fa-x" x="0" y={y + rh / 2 + 4}>
                              {i + 1}º tri
                            </text>
                            <rect
                              className={v < 0 ? 'fa-neg' : 'fa-bar2'}
                              x={lw}
                              y={y + rh / 2 - 9}
                              width={Math.max(w, v ? 2 : 0)}
                              height={18}
                              rx={4}
                            >
                              <title>Saldo acumulado até {i + 1}º tri: {money(v)}</title>
                            </rect>
                            <text className="fa-vn" x={lw + w + 8} y={y + rh / 2 + 4}>
                              {money(v)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>
            </section>
          </div>

          {/* Grid: Orçado x gasto da organização + Maiores lançamentos */}
          <div className="grid2">
            {/* Orçado x gasto da organização selecionada */}
            <section className="card">
              <div className="head" style={{ marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                <h3 style={{ margin: 0 }}>Orçado x gasto da organização</h3>
                <select
                  className="inp"
                  value={annualOrgFilter}
                  onChange={e => setAnnualOrgFilter(e.target.value)}
                  style={{ maxWidth: 220, fontSize: 13 }}
                >
                  {annualData.uniqueOrgs.map(o => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div className="legend" style={{ marginBottom: 6 }}>
                <span><i className="lg-rec" /> Orçado</span>
                <span><i className="lg-gas" /> Gasto</span>
              </div>

              <div className="fa-chart">
                {(() => {
                  const W = 460;
                  const H = 200;
                  const ml = 12;
                  const mr = 12;
                  const mt = 24;
                  const mb = 26;
                  const iw = W - ml - mr;
                  const ih = H - mt - mb;
                  const n = 4;
                  const bw = Math.min(32, (iw / n) * 0.32);

                  const og = [1, 2, 3, 4].map(t => {
                    const p = `${selectedYear}-T${t}`;
                    const orc = orcamentos[p];
                    const row = orc?.linhas.find(l => l.nome === annualOrgFilter);
                    const orcVal = row ? row.valor : 0;
                    const gastoVal = lancamentos
                      .filter(l => l.periodo === p && lineName(l.linha) === annualOrgFilter)
                      .reduce((s, l) => s + (l.valor || 0), 0);
                    return { t, orcVal, gastoVal };
                  });

                  const mx = Math.max(1, ...og.map(z => Math.max(z.orcVal, z.gastoVal))) * 1.15;
                  const X = (i: number) => ml + (iw / n) * (i + 0.5);

                  return (
                    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Orçado e gasto de ${annualOrgFilter}`}>
                      <line className="fa-base" x1={ml} x2={W - mr} y1={mt + ih} y2={mt + ih} />
                      {og.map((z, i) => {
                        const h1 = (z.orcVal / mx) * ih;
                        const h2 = (z.gastoVal / mx) * ih;
                        const isOver = z.gastoVal > z.orcVal && z.orcVal > 0;
                        return (
                          <g key={z.t}>
                            {/* Barra Orçado */}
                            <rect
                              className="fa-bar2"
                              x={X(i) - bw - 2}
                              y={mt + ih - h1}
                              width={bw}
                              height={Math.max(h1, z.orcVal ? 2 : 0)}
                              rx={4}
                            >
                              <title>{z.t}º tri · orçado {money(z.orcVal)}</title>
                            </rect>
                            {/* Barra Gasto */}
                            <rect
                              className={isOver ? 'fa-neg' : 'fa-bar'}
                              x={X(i) + 2}
                              y={mt + ih - h2}
                              width={bw}
                              height={Math.max(h2, z.gastoVal ? 2 : 0)}
                              rx={4}
                            >
                              <title>{z.t}º tri · gasto {money(z.gastoVal)}</title>
                            </rect>

                            {z.orcVal > 0 && (
                              <text className="fa-vr" x={X(i) - bw / 2 - 2} y={mt + ih - h1 - 5} textAnchor="middle" style={{ fontSize: 10 }}>
                                {kfmt(z.orcVal)}
                              </text>
                            )}
                            {z.gastoVal > 0 && (
                              <text className="fa-vg" x={X(i) + bw / 2 + 2} y={mt + ih - h2 - 5} textAnchor="middle" style={{ fontSize: 10 }}>
                                {kfmt(z.gastoVal)}
                              </text>
                            )}
                            <text className="fa-x" x={X(i)} y={H - 8} textAnchor="middle">
                              {z.t}º tri
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>
            </section>

            {/* Maiores lançamentos de [Ano] */}
            <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="head" style={{ marginBottom: 4 }}>
                <h3 style={{ margin: 0 }}>Maiores lançamentos de {selectedYear}</h3>
                <button type="button" className="btn ghost sm" onClick={() => setActiveView('lanc')}>
                  Ver todos
                </button>
              </div>

              {annualData.topLancamentos.length ? (
                <div className="list">
                  {annualData.topLancamentos.map(l => (
                    <div key={l.id} className="row">
                      <div className="row-main">
                        <div className="row-t">{l.descricao}</div>
                        <div className="row-m">
                          <span>{formatDateBr(l.data)}</span>
                          <span>{lineName(l.linha)}</span>
                          <span>{l.periodo}</span>
                        </div>
                      </div>
                      <span className="money">{money(l.valor)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty">Nenhum lançamento no ano de {selectedYear}.</div>
              )}
            </section>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* 3. ABA LANÇAMENTOS                                        */}
      {/* ========================================================= */}
      {activeView === 'lanc' && (
        <>
          {/* Caixa de Pesquisa e Filtros */}
          <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="head">
              <h3 style={{ margin: 0 }}>Pesquisar lançamentos</h3>
              <div className="btns">
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => {
                    setFlAno('');
                    setFlTri('');
                    setFlOrg('');
                    setFlDe('');
                    setFlAte('');
                    setFlQuery('');
                  }}
                >
                  Limpar filtros
                </button>
                <button type="button" className="btn sm" onClick={handleDownloadCSV}>
                  Exportar planilha (CSV)
                </button>
              </div>
            </div>

            <div className="fl-filters">
              <div className="field">
                <label>Ano</label>
                <select className="inp" value={flAno} onChange={e => setFlAno(e.target.value)}>
                  <option value="">Todos</option>
                  {allYears.map(y => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Trimestre</label>
                <select className="inp" value={flTri} onChange={e => setFlTri(e.target.value)}>
                  <option value="">Todos</option>
                  {[1, 2, 3, 4].map(t => (
                    <option key={t} value={t}>
                      {t}º trimestre
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Organização</label>
                <select className="inp" value={flOrg} onChange={e => setFlOrg(e.target.value)}>
                  <option value="">Todas</option>
                  {allOrgsInLancamentos.map(o => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>De</label>
                <input className="inp" type="date" value={flDe} onChange={e => setFlDe(e.target.value)} />
              </div>

              <div className="field">
                <label>Até</label>
                <input className="inp" type="date" value={flAte} onChange={e => setFlAte(e.target.value)} />
              </div>

              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label>Buscar</label>
                <input
                  className="inp"
                  type="search"
                  placeholder="Descrição, nota ou nome"
                  value={flQuery}
                  onChange={e => setFlQuery(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Gráfico: Total por organização (dos lançamentos filtrados) */}
          <section className="card">
            <div className="head" style={{ marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Total por organização</h3>
              <span className="row-m">dos lançamentos filtrados</span>
            </div>

            <div className="fa-chart">
              {flStats.ranking.length ? (
                (() => {
                  const ranking = flStats.ranking;
                  const rh = 30;
                  const H = ranking.length * rh + 8;
                  const W = 720;
                  const lw = 180;
                  const vw = 110;
                  const iw = W - lw - vw;
                  const mx = ranking[0][1] || 1;

                  return (
                    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Total gasto por organização">
                      {ranking.map(([n, v], i) => {
                        const y = 4 + i * rh;
                        const w = (v / mx) * iw;
                        return (
                          <g key={n}>
                            <text className="oc-name" x="0" y={y + rh / 2 + 4}>
                              {n.length > 22 ? `${n.slice(0, 21)}…` : n}
                            </text>
                            <rect
                              className="fa-bar"
                              x={lw}
                              y={y + rh / 2 - 8}
                              width={Math.max(w, 2)}
                              height={16}
                              rx={4}
                            >
                              <title>{n} · {money(v)}</title>
                            </rect>
                            <text className="fa-vn" x={lw + w + 8} y={y + rh / 2 + 4}>
                              {money(v)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()
              ) : (
                <div className="empty">Nenhum lançamento para exibir no gráfico.</div>
              )}
            </div>
          </section>

          {/* Faixa de Estatísticas e Tabela Detalhada */}
          <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="stats">
              <div className="stat">
                <div className="v num">{flStats.count}</div>
                <div className="l">lançamentos</div>
              </div>
              <div className="stat">
                <div className="v m">{money(flStats.total)}</div>
                <div className="l">total</div>
              </div>
              <div className="stat">
                <div className="v m">{money(flStats.avg)}</div>
                <div className="l">média por lançamento</div>
              </div>
              <div className="stat">
                <div className="v m">{money(flStats.max)}</div>
                <div className="l">maior lançamento</div>
              </div>
            </div>

            {filteredLancamentosList.length ? (
              <div className="tscroll">
                <table className="ltbl">
                  <thead>
                    <tr>
                      <th>
                        <button
                          type="button"
                          onClick={() => {
                            if (flSort === 'data') setFlDir(d => (d === 'asc' ? 'desc' : 'asc'));
                            else {
                              setFlSort('data');
                              setFlDir('desc');
                            }
                          }}
                        >
                          Data {flSort === 'data' ? (flDir === 'asc' ? '↑' : '↓') : ''}
                        </button>
                      </th>
                      <th>Trimestre</th>
                      <th>Organização</th>
                      <th>Descrição</th>
                      <th>Nota</th>
                      <th>Solicitado por</th>
                      <th className="n">
                        <button
                          type="button"
                          onClick={() => {
                            if (flSort === 'valor') setFlDir(d => (d === 'asc' ? 'desc' : 'asc'));
                            else {
                              setFlSort('valor');
                              setFlDir('desc');
                            }
                          }}
                        >
                          Valor {flSort === 'valor' ? (flDir === 'asc' ? '↑' : '↓') : ''}
                        </button>
                      </th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLancamentosList.map(l => (
                      <tr key={l.id}>
                        <td>{formatDateBr(l.data)}</td>
                        <td>{l.periodo}</td>
                        <td>{lineName(l.linha)}</td>
                        <td style={{ fontWeight: 600 }}>{l.descricao}</td>
                        <td>{l.nota || '—'}</td>
                        <td>{l.solicitante || '—'}</td>
                        <td className="n money">{money(l.valor)}</td>
                        <td style={{ textAlign: 'right' }}>
                          {canWrite && (
                            <button
                              type="button"
                              className="btn ghost sm"
                              onClick={() => openEditExpenseModal(l)}
                            >
                              Editar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={6}>Total ({flStats.count} lançamentos)</td>
                      <td className="n money">{money(flStats.total)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="empty">Nenhum lançamento encontrado com os filtros selecionados.</div>
            )}
          </section>
        </>
      )}

      {/* ========================================================= */}
      {/* MODAL: Lançar / Editar Despesa                            */}
      {/* ========================================================= */}
      {isExpenseModalOpen && (
        <div className="modal" onClick={() => setIsExpenseModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>
              {editingLancamentoId ? 'Editar despesa' : 'Lançar despesa'} · {selectedPeriod}
            </h3>
            <form onSubmit={handleExpenseSubmit} className="form">
              <div className="two">
                <div className="field">
                  <label>Valor (R$) *</label>
                  <input
                    className="inp"
                    value={expValor}
                    onChange={e => setExpValor(e.target.value)}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div className="field">
                  <label>Organização</label>
                  <select
                    className="inp"
                    value={expLinha}
                    onChange={e => setExpLinha(e.target.value)}
                  >
                    {linesWithSpending.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.nome} · saldo {money(l.saldo)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Descrição *</label>
                <input
                  className="inp"
                  value={expDesc}
                  onChange={e => setExpDesc(e.target.value)}
                  placeholder="Ex.: Lanche da atividade dos jovens"
                  required
                />
              </div>

              <div className="two">
                <div className="field">
                  <label>Data da nota</label>
                  <input
                    className="inp"
                    type="date"
                    value={expData}
                    onChange={e => setExpData(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label>Nº da nota fiscal (opcional)</label>
                  <input
                    className="inp"
                    value={expNota}
                    onChange={e => setExpNota(e.target.value)}
                    placeholder="Ex.: NF 12345"
                  />
                </div>
              </div>

              <div className="field">
                <label>Solicitado por (opcional)</label>
                <input
                  className="inp"
                  value={expSolicitante}
                  onChange={e => setExpSolicitante(e.target.value)}
                  placeholder="Ex.: Irmão João Silva"
                />
              </div>

              <div className="foot">
                <div className="btns" style={{ justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    {editingLancamentoId && canWrite && (
                      <button
                        type="button"
                        className="btn ghost sm s-crit"
                        onClick={() => handleDeleteExpense(editingLancamentoId)}
                      >
                        Excluir despesa
                      </button>
                    )}
                  </div>
                  <div className="btns">
                    <button type="button" className="btn ghost" onClick={() => setIsExpenseModalOpen(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn pri">
                      {editingLancamentoId ? 'Salvar alterações' : 'Salvar despesa'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Orçamento                                          */}
      {/* ========================================================= */}
      {isBudgetModalOpen && (
        <div className="modal" onClick={() => setIsBudgetModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>Orçamento · {curTri}º trimestre de {curYear}</h3>
            <p className="sub" style={{ margin: '-6px 0 12px' }}>{perMesesTxt(selectedPeriod)}</p>

            <form onSubmit={handleBudgetSubmit} className="form">
              <div className="field">
                <label>Valor recebido da Igreja para o trimestre (R$)</label>
                <input
                  className="inp"
                  value={bgRec}
                  onChange={e => setBgRec(e.target.value)}
                  placeholder="9.600,00"
                  required
                />
              </div>

              <div className="grp">
                <span className="lbl">Divisão por organização ou evento</span>
                <div className="form" style={{ gap: 8 }}>
                  {bgLinhas.map(l => (
                    <div key={l.id} className="budget-row">
                      <input
                        className="inp"
                        value={l.nome}
                        onChange={e => updateBudgetLine(l.id, 'nome', e.target.value)}
                        placeholder="Ex.: Sociedade de Socorro"
                        required
                      />
                      <input
                        className="inp"
                        type="text"
                        inputMode="decimal"
                        value={l.valor}
                        onChange={e => updateBudgetLine(l.id, 'valor', e.target.value)}
                        placeholder="0,00"
                      />
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() => removeBudgetLine(l.id)}
                        title={currentLancamentos.some(x => x.linha === l.id) ? 'Esta organização possui despesas lançadas' : 'Remover categoria'}
                        aria-label="Remover linha"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn sm"
                  onClick={addBudgetLine}
                  style={{ alignSelf: 'flex-start', marginTop: 8 }}
                >
                  + Adicionar linha
                </button>
              </div>

              {(() => {
                const recVal = parseFloat(bgRec.replace(/\./g, '').replace(',', '.')) || 0;
                const sumVal = bgLinhas.reduce((s, l) => {
                  const v = typeof l.valor === 'number' ? l.valor : parseFloat(String(l.valor).replace(/\./g, '').replace(',', '.')) || 0;
                  return s + v;
                }, 0);
                const diff = recVal - sumVal;
                return (
                  <div style={{ marginTop: 8 }}>
                    <div className="btot">
                      <span>Distribuído</span>
                      <span className="money">{money(sumVal)}</span>
                    </div>
                    <div className="btot">
                      <span>{diff >= 0 ? 'Sem destino' : 'Acima do recebido'}</span>
                      <span className={`money ${diff < 0 ? 's-crit' : ''}`}>
                        {money(Math.abs(diff))}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="foot">
                <div className="btns">
                  <button type="button" className="btn ghost" onClick={() => setIsBudgetModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn pri">
                    Salvar orçamento
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
