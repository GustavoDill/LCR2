import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { FinanceiroTrimestre, LancamentoFinanceiro, LinhaOrcamento } from '../types';
import { Icon } from '../components/Icons';

export const Financeiro: React.FC = () => {
  const { isBishopric, canWrite } = useAuth();
  const [orcamentos, setOrcamentos] = useState<Record<string, FinanceiroTrimestre>>({});
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'tri' | 'lanc'>('tri');

  // Quarter navigation
  const today = new Date();
  const curPeriod = `${today.getFullYear()}-T${Math.floor(today.getMonth() / 3) + 1}`;
  const [selectedPeriod, setSelectedPeriod] = useState<string>(curPeriod);

  // New expense form modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expValor, setExpValor] = useState('');
  const [expLinha, setExpLinha] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expData, setExpData] = useState(today.toISOString().split('T')[0]);
  const [expNota, setExpNota] = useState('');
  const [expSolicitante, setExpSolicitante] = useState('');

  // Budget modal
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [bgRec, setBgRec] = useState('');
  const [bgLinhas, setBgLinhas] = useState<LinhaOrcamento[]>([]);

  // Search filter for lancamentos
  const [lancSearch, setLancSearch] = useState('');

  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const money = (v: number) => BRL.format(v || 0);

  useEffect(() => {
    loadFinData();
  }, [isBishopric]);

  async function loadFinData() {
    try {
      const res = await api.get<{ orcamentos: Record<string, FinanceiroTrimestre>; lancamentos: LancamentoFinanceiro[] }>('/financeiro/data');
      setOrcamentos(res.orcamentos || {});
      setLancamentos(res.lancamentos || []);
    } catch (err) {
      console.error(err);
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
  }

  function openNewExpenseModal(preLinha?: string) {
    const curBudget = orcamentos[selectedPeriod];
    const defaultLinha = preLinha || curBudget?.linhas?.[0]?.id || '';
    setExpLinha(defaultLinha);
    setExpValor('');
    setExpDesc('');
    setExpData(today.toISOString().split('T')[0]);
    setExpNota('');
    setExpSolicitante('');
    setIsExpenseModalOpen(true);
  }

  function openBudgetModal() {
    const curBudget = orcamentos[selectedPeriod];
    setBgRec(curBudget ? String(curBudget.recebido) : '9600');
    setBgLinhas(
      curBudget?.linhas?.length
        ? curBudget.linhas.map(l => ({ ...l }))
        : [
            { id: 'lin-ss', nome: 'Sociedade de Socorro', valor: 1800 },
            { id: 'lin-qe', nome: 'Quórum de Élderes', valor: 1500 },
            { id: 'lin-rap', nome: 'Rapazes', valor: 1600 },
            { id: 'lin-moc', nome: 'Moças', valor: 1600 },
            { id: 'lin-pri', nome: 'Primária', valor: 1400 },
            { id: 'lin-sem', nome: 'Seminário', valor: 500 },
          ]
    );
    setIsBudgetModalOpen(true);
  }

  async function handleExpenseSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(expValor.replace(/\./g, '').replace(',', '.'));
    if (!val || val <= 0) return alert('Informe um valor válido maior que zero.');

    try {
      await api.post('/financeiro/lancamentos', {
        periodo: selectedPeriod,
        linha: expLinha,
        valor: val,
        descricao: expDesc,
        data: expData,
        nota: expNota,
        solicitante: expSolicitante,
      });
      setIsExpenseModalOpen(false);
      loadFinData();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar despesa');
    }
  }

  async function handleBudgetSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rec = parseFloat(bgRec.replace(/\./g, '').replace(',', '.'));
    if (isNaN(rec)) return alert('Informe o valor recebido.');

    try {
      await api.post('/financeiro/budget', {
        periodo: selectedPeriod,
        recebido: rec,
        linhas: bgLinhas,
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
      a.download = `lancamentos-ala-bosque.csv`;
      a.click();
    } catch (err: any) {
      alert(err.message || 'Erro ao exportar CSV');
    }
  }

  if (!isBishopric) {
    return <div className="notice bisp">Acesso restrito aos membros do Bispado.</div>;
  }

  if (loading) {
    return <div className="empty">Carregando financeiro da ala…</div>;
  }

  const currentBudget = orcamentos[selectedPeriod];
  const currentLancamentos = lancamentos.filter(l => l.periodo === selectedPeriod);

  // Calculate totals
  const totalRecebido = currentBudget ? currentBudget.recebido : 0;
  const totalGasto = currentLancamentos.reduce((s, l) => s + (l.valor || 0), 0);
  const saldoDisponivel = totalRecebido - totalGasto;
  const pctGasto = totalRecebido ? Math.round((totalGasto / totalRecebido) * 100) : 0;

  // Org row totals
  const orgTotals: Record<string, number> = {};
  currentLancamentos.forEach(l => {
    orgTotals[l.linha] = (orgTotals[l.linha] || 0) + (l.valor || 0);
  });

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h2>Financeiro</h2>
          <p className="sub">
            Os valores da Igreja chegam por trimestre, e cada despesa é lançada no trimestre a que pertence.
          </p>
        </div>

        <div className="mnav">
          <button type="button" className="btn sm" onClick={() => shiftPeriod(-1)}>
            ‹
          </button>
          <span className="m">{selectedPeriod}</span>
          <button type="button" className="btn sm" onClick={() => shiftPeriod(1)}>
            ›
          </button>
        </div>
      </div>

      <div className="seg" role="tablist">
        <button
          type="button"
          className={activeView === 'tri' ? 'on' : ''}
          onClick={() => setActiveView('tri')}
        >
          <Icon name="wallet" /> Trimestre
        </button>
        <button
          type="button"
          className={activeView === 'lanc' ? 'on' : ''}
          onClick={() => setActiveView('lanc')}
        >
          <Icon name="receipt" /> Lançamentos ({lancamentos.length})
        </button>
      </div>

      {activeView === 'tri' && (
        <>
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

          <div className="kgrid">
            <div className="kcard">
              <h4>Recebido no trimestre</h4>
              <div className="kbody">
                <span className="kval">{money(totalRecebido)}</span>
              </div>
              <div className="ksub">Orçamento aprovado</div>
            </div>

            <div className="kcard">
              <h4>Total gasto</h4>
              <div className="kbody">
                <span className="kval">{money(totalGasto)}</span>
              </div>
              <div className="ksub">{pctGasto}% do recebido</div>
            </div>

            <div className="kcard">
              <h4>Saldo disponível</h4>
              <div className="kbody">
                <span className={`kval ${saldoDisponivel < 0 ? 's-crit' : 's-bom'}`}>
                  {money(saldoDisponivel)}
                </span>
              </div>
              <div className="ksub">Restante para o trimestre</div>
            </div>

            <div className="kcard">
              <h4>Lançamentos</h4>
              <div className="kbody">
                <span className="kval">{currentLancamentos.length}</span>
              </div>
              <div className="ksub">despesas registradas</div>
            </div>
          </div>

          <div className="g21">
            <section className="card">
              <div className="head" style={{ marginBottom: 10 }}>
                <h3 style={{ margin: 0 }}>Detalhamento por organização</h3>
              </div>

              {currentBudget?.linhas?.length ? (
                <div className="tscroll">
                  <table className="dtbl">
                    <thead>
                      <tr>
                        <th>Organização</th>
                        <th className="n">Orçado</th>
                        <th className="n">Gasto</th>
                        <th className="n">Saldo</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBudget.linhas.map(linha => {
                        const gasto = orgTotals[linha.id] || 0;
                        const saldo = linha.valor - gasto;

                        return (
                          <tr key={linha.id}>
                            <td style={{ fontWeight: 600 }}>{linha.nome}</td>
                            <td className="n">{money(linha.valor)}</td>
                            <td className="n" style={{ fontWeight: 700 }}>{money(gasto)}</td>
                            <td className={`n ${saldo < 0 ? 's-crit' : 's-bom'}`}>{money(saldo)}</td>
                            <td style={{ textAlign: 'right' }}>
                              {canWrite && (
                                <button
                                  type="button"
                                  className="btn ghost sm"
                                  onClick={() => openNewExpenseModal(linha.id)}
                                >
                                  + Lançar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty">Nenhuma linha de orçamento definida para este trimestre.</div>
              )}
            </section>

            <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="head">
                <h3 style={{ margin: 0 }}>Lançamentos recentes</h3>
              </div>

              {currentLancamentos.length ? (
                <div className="list">
                  {currentLancamentos.slice(0, 6).map(l => (
                    <div key={l.id} className="row">
                      <div className="row-main">
                        <div className="row-t">{l.descricao}</div>
                        <div className="row-m">
                          <span>{l.data}</span>
                          {l.solicitante && <span>{l.solicitante}</span>}
                        </div>
                      </div>
                      <span className="money">{money(l.valor)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty">Nenhum lançamento no trimestre.</div>
              )}
            </section>
          </div>
        </>
      )}

      {activeView === 'lanc' && (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="head">
            <h3 style={{ margin: 0 }}>Pesquisar lançamentos</h3>
            <button type="button" className="btn sm" onClick={handleDownloadCSV}>
              Exportar CSV
            </button>
          </div>

          <input
            className="inp"
            type="search"
            placeholder="Buscar por descrição, número de nota ou solicitante"
            value={lancSearch}
            onChange={e => setLancSearch(e.target.value)}
          />

          <div className="tscroll">
            <table className="dtbl">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Trimestre</th>
                  <th>Descrição</th>
                  <th>Nota</th>
                  <th>Solicitado por</th>
                  <th className="n">Valor</th>
                </tr>
              </thead>
              <tbody>
                {lancamentos
                  .filter(l => {
                    if (lancSearch) {
                      const txt = `${l.descricao} ${l.nota || ''} ${l.solicitante || ''}`.toLowerCase();
                      if (!txt.includes(lancSearch.toLowerCase())) return false;
                    }
                    return true;
                  })
                  .map(l => (
                    <tr key={l.id}>
                      <td>{l.data}</td>
                      <td>{l.periodo}</td>
                      <td style={{ fontWeight: 600 }}>{l.descricao}</td>
                      <td>{l.nota || '—'}</td>
                      <td>{l.solicitante || '—'}</td>
                      <td className="n money">{money(l.valor)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal: Lançar Despesa */}
      {isExpenseModalOpen && (
        <div className="modal" onClick={() => setIsExpenseModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>Lançar despesa · {selectedPeriod}</h3>
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
                    {currentBudget?.linhas?.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.nome}
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
                  />
                </div>
                <div className="field">
                  <label>Nº da nota fiscal</label>
                  <input
                    className="inp"
                    value={expNota}
                    onChange={e => setExpNota(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="field">
                <label>Solicitado por</label>
                <input
                  className="inp"
                  value={expSolicitante}
                  onChange={e => setExpSolicitante(e.target.value)}
                  placeholder="Ex.: Pres. Moças"
                />
              </div>

              <div className="foot">
                <div className="btns">
                  <button type="submit" className="btn pri">
                    Salvar despesa
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setIsExpenseModalOpen(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Orçamento */}
      {isBudgetModalOpen && (
        <div className="modal" onClick={() => setIsBudgetModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>Orçamento · {selectedPeriod}</h3>
            <form onSubmit={handleBudgetSubmit} className="form">
              <div className="field">
                <label>Valor recebido da Igreja (R$)</label>
                <input
                  className="inp"
                  value={bgRec}
                  onChange={e => setBgRec(e.target.value)}
                  required
                />
              </div>

              <div className="grp">
                <span className="lbl">Divisão por organização</span>
                {bgLinhas.map((linha, idx) => (
                  <div key={linha.id} className="two" style={{ gap: 8, alignItems: 'center' }}>
                    <input
                      className="inp"
                      value={linha.nome}
                      onChange={e => {
                        const updated = [...bgLinhas];
                        updated[idx].nome = e.target.value;
                        setBgLinhas(updated);
                      }}
                    />
                    <input
                      className="inp"
                      type="number"
                      value={linha.valor}
                      onChange={e => {
                        const updated = [...bgLinhas];
                        updated[idx].valor = parseFloat(e.target.value) || 0;
                        setBgLinhas(updated);
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="foot">
                <div className="btns">
                  <button type="submit" className="btn pri">
                    Salvar orçamento
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setIsBudgetModalOpen(false)}>
                    Cancelar
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
