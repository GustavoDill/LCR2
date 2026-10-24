import React from 'react';
import { LancamentoFinanceiro } from '../../types';
import { FST, StatusKey } from './financeiroConstants';
import { getStatus, money, perMesesTxt } from './financeiroUtils';
import { FinanceiroRing } from './FinanceiroRing';
import { FinanceiroDonut } from './FinanceiroDonut';

interface LineWithSpending {
  id: string;
  nome: string;
  valor: number;
  orfa?: boolean;
  orc: number;
  gasto: number;
  saldo: number;
  pct: number;
  st: StatusKey;
}

interface FinanceiroTrimestreTabProps {
  curTri: number;
  curYear: number;
  selectedPeriod: string;
  curPeriod: string;
  isCurrentPeriod: boolean;
  canWrite: boolean;
  totalRecebido: number;
  totalDistribuido: number;
  totalGasto: number;
  saldoDisponivel: number;
  pctGasto: number;
  salPct: number;
  dentroDoOrcamento: number;
  maiorGastoLinha?: LineWithSpending;
  linesWithSpending: LineWithSpending[];
  currentLancamentos: LancamentoFinanceiro[];
  filteredQuarterLancamentos: LancamentoFinanceiro[];
  selectedOrgFilter: string;
  situacaoCounts: Record<StatusKey, { count: number; gasto: number }>;
  orgTotals: Record<string, number>;
  onSetSelectedPeriod: (p: string) => void;
  onSetSelectedOrgFilter: (orgId: string) => void;
  onOpenNewExpenseModal: (linhaId?: string) => void;
  onOpenEditExpenseModal: (l: LancamentoFinanceiro) => void;
  onOpenBudgetModal: () => void;
  onDownloadCSV: () => void;
  lineName: (linhaId: string) => string;
}

export const FinanceiroTrimestreTab: React.FC<FinanceiroTrimestreTabProps> = ({
  curTri,
  curYear,
  selectedPeriod,
  curPeriod,
  isCurrentPeriod,
  canWrite,
  totalRecebido,
  totalDistribuido,
  totalGasto,
  saldoDisponivel,
  pctGasto,
  salPct,
  dentroDoOrcamento,
  maiorGastoLinha,
  linesWithSpending,
  currentLancamentos,
  filteredQuarterLancamentos,
  selectedOrgFilter,
  situacaoCounts,
  orgTotals,
  onSetSelectedPeriod,
  onSetSelectedOrgFilter,
  onOpenNewExpenseModal,
  onOpenEditExpenseModal,
  onOpenBudgetModal,
  onDownloadCSV,
  lineName,
}) => {
  return (
    <>
      <div className={`notice ${isCurrentPeriod ? 'bisp' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span>
          <b>{curTri}º trimestre de {curYear}</b> · {perMesesTxt(selectedPeriod)}
          {isCurrentPeriod ? ' · trimestre atual' : ''}
        </span>
        {!isCurrentPeriod && (
          <button type="button" className="btn sm" onClick={() => onSetSelectedPeriod(curPeriod)}>
            Voltar ao trimestre atual ({curPeriod.split('-T')[1]}º tri {curPeriod.split('-T')[0]})
          </button>
        )}
      </div>

      <div className="btns">
        {canWrite && (
          <>
            <button type="button" className="btn bisp" onClick={() => onOpenNewExpenseModal()}>
              + Lançar despesa
            </button>
            <button type="button" className="btn" onClick={onOpenBudgetModal}>
              Editar orçamento
            </button>
          </>
        )}
        <button type="button" className="btn ghost" onClick={onDownloadCSV}>
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
            <FinanceiroRing pct={pctGasto} st={getStatus(pctGasto)} />
            <span className="kval">{money(totalGasto)}</span>
          </div>
          <div className={`ksub s-${getStatus(pctGasto)}`}>
            {FST[getStatus(pctGasto)][0]} · gasto do recebido
          </div>
        </div>

        <div className="kcard">
          <h4>Saldo disponível</h4>
          <div className="kbody">
            <FinanceiroRing pct={salPct} st={saldoDisponivel < 0 ? 'crit' : 'bom'} />
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
            <FinanceiroRing
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
        {/* Lado Esquerdo: Detalhamento por organização */}
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
                            onClick={() => onSetSelectedOrgFilter(isSelected ? 'todas' : r.id)}
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
                              onClick={() => onOpenNewExpenseModal(r.id)}
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
            <FinanceiroDonut recebido={totalRecebido} gasto={totalGasto} saldo={saldoDisponivel} />
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
            <button type="button" className="btn ghost sm" onClick={() => onSetSelectedOrgFilter('todas')}>
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
              onClick={() => onSetSelectedOrgFilter('todas')}
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
                  onClick={() => onSetSelectedOrgFilter(l.id)}
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
                    <span>{l.data ? l.data.split('-').reverse().join('/') : '—'}</span>
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
                      onClick={() => onOpenEditExpenseModal(l)}
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
  );
};
