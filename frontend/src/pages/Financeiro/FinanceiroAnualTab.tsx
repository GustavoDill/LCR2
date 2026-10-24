import React from 'react';
import { FinanceiroTrimestre, LancamentoFinanceiro } from '../../types';
import { MES3L, MESES } from './financeiroConstants';
import { formatDateBr, kfmt, money } from './financeiroUtils';

interface AnnualData {
  qList: { p: string; t: number; rec: number; gasto: number; saldo: number }[];
  yearLancamentos: LancamentoFinanceiro[];
  monthlyGasto: number[];
  accumulated: number[];
  uniqueOrgs: string[];
  totalRec: number;
  totalGastoAno: number;
  annualSaldo: number;
  topOrgName: string | null;
  topLancamentos: LancamentoFinanceiro[];
}

interface FinanceiroAnualTabProps {
  selectedYear: number;
  annualData: AnnualData;
  annualOrgFilter: string;
  onSetAnnualOrgFilter: (org: string) => void;
  onSelectLancamentosTab: () => void;
  orcamentos: Record<string, FinanceiroTrimestre>;
  lancamentos: LancamentoFinanceiro[];
  lineName: (linhaId: string) => string;
}

export const FinanceiroAnualTab: React.FC<FinanceiroAnualTabProps> = ({
  selectedYear,
  annualData,
  annualOrgFilter,
  onSetAnnualOrgFilter,
  onSelectLancamentosTab,
  orcamentos,
  lancamentos,
  lineName,
}) => {
  return (
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
              onChange={e => onSetAnnualOrgFilter(e.target.value)}
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
            <button type="button" className="btn ghost sm" onClick={onSelectLancamentosTab}>
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
  );
};
