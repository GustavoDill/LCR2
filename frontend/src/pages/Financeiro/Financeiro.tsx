import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { FinanceiroTrimestre, LancamentoFinanceiro, LinhaOrcamento } from '../../types';
import { Icon } from '../../components/Icons';
import { DEFAULT_ORGS, StatusKey } from './financeiroConstants';
import { generateLineId, getStatus, perMesesTxt } from './financeiroUtils';
import { FinanceiroTrimestreTab } from './FinanceiroTrimestreTab';
import { FinanceiroAnualTab } from './FinanceiroAnualTab';
import { FinanceiroLancamentosTab } from './FinanceiroLancamentosTab';
import { FinanceiroExpenseModal } from './FinanceiroExpenseModal';
import { FinanceiroBudgetModal, BudgetLineInput } from './FinanceiroBudgetModal';

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
  const salPct = totalRecebido ? (Math.max(0, saldoDisponivel) / totalRecebido) * 100 : 0;
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

      {/* 1. ABA TRIMESTRE */}
      {activeView === 'tri' && (
        <FinanceiroTrimestreTab
          curTri={curTri}
          curYear={curYear}
          selectedPeriod={selectedPeriod}
          curPeriod={curPeriod}
          isCurrentPeriod={isCurrentPeriod}
          canWrite={canWrite}
          totalRecebido={totalRecebido}
          totalDistribuido={totalDistribuido}
          totalGasto={totalGasto}
          saldoDisponivel={saldoDisponivel}
          pctGasto={pctGasto}
          salPct={salPct}
          dentroDoOrcamento={dentroDoOrcamento}
          maiorGastoLinha={maiorGastoLinha}
          linesWithSpending={linesWithSpending}
          currentLancamentos={currentLancamentos}
          filteredQuarterLancamentos={filteredQuarterLancamentos}
          selectedOrgFilter={selectedOrgFilter}
          situacaoCounts={situacaoCounts}
          orgTotals={orgTotals}
          onSetSelectedPeriod={setSelectedPeriod}
          onSetSelectedOrgFilter={setSelectedOrgFilter}
          onOpenNewExpenseModal={openNewExpenseModal}
          onOpenEditExpenseModal={openEditExpenseModal}
          onOpenBudgetModal={openBudgetModal}
          onDownloadCSV={handleDownloadCSV}
          lineName={lineName}
        />
      )}

      {/* 2. ABA VISÃO ANUAL */}
      {activeView === 'ano' && (
        <FinanceiroAnualTab
          selectedYear={selectedYear}
          annualData={annualData}
          annualOrgFilter={annualOrgFilter}
          onSetAnnualOrgFilter={setAnnualOrgFilter}
          onSelectLancamentosTab={() => setActiveView('lanc')}
          orcamentos={orcamentos}
          lancamentos={lancamentos}
          lineName={lineName}
        />
      )}

      {/* 3. ABA LANÇAMENTOS */}
      {activeView === 'lanc' && (
        <FinanceiroLancamentosTab
          allYears={allYears}
          allOrgsInLancamentos={allOrgsInLancamentos}
          flAno={flAno}
          setFlAno={setFlAno}
          flTri={flTri}
          setFlTri={setFlTri}
          flOrg={flOrg}
          setFlOrg={setFlOrg}
          flDe={flDe}
          setFlDe={setFlDe}
          flAte={flAte}
          setFlAte={setFlAte}
          flQuery={flQuery}
          setFlQuery={setFlQuery}
          flSort={flSort}
          setFlSort={setFlSort}
          flDir={flDir}
          setFlDir={setFlDir}
          flStats={flStats}
          filteredLancamentosList={filteredLancamentosList}
          canWrite={canWrite}
          onOpenEditExpenseModal={openEditExpenseModal}
          onDownloadCSV={handleDownloadCSV}
          lineName={lineName}
        />
      )}

      {/* MODAL: Lançar / Editar Despesa */}
      <FinanceiroExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        editingLancamentoId={editingLancamentoId}
        selectedPeriod={selectedPeriod}
        expValor={expValor}
        setExpValor={setExpValor}
        expLinha={expLinha}
        setExpLinha={setExpLinha}
        expDesc={expDesc}
        setExpDesc={setExpDesc}
        expData={expData}
        setExpData={setExpData}
        expNota={expNota}
        setExpNota={setExpNota}
        expSolicitante={expSolicitante}
        setExpSolicitante={setExpSolicitante}
        linesWithSpending={linesWithSpending}
        canWrite={canWrite}
        onSubmit={handleExpenseSubmit}
        onDelete={handleDeleteExpense}
      />

      {/* MODAL: Orçamento */}
      <FinanceiroBudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        curTri={curTri}
        curYear={curYear}
        selectedPeriod={selectedPeriod}
        bgRec={bgRec}
        setBgRec={setBgRec}
        bgLinhas={bgLinhas}
        updateBudgetLine={updateBudgetLine}
        removeBudgetLine={removeBudgetLine}
        addBudgetLine={addBudgetLine}
        onSubmit={handleBudgetSubmit}
        currentLancamentos={currentLancamentos}
      />
    </div>
  );
};
