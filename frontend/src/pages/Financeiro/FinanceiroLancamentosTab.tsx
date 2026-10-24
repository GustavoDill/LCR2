import React from 'react';
import { LancamentoFinanceiro } from '../../types';
import { formatDateBr, money } from './financeiroUtils';

interface FlStats {
  count: number;
  total: number;
  avg: number;
  max: number;
  ranking: [string, number][];
}

interface FinanceiroLancamentosTabProps {
  allYears: number[];
  allOrgsInLancamentos: string[];
  flAno: string;
  setFlAno: (v: string) => void;
  flTri: string;
  setFlTri: (v: string) => void;
  flOrg: string;
  setFlOrg: (v: string) => void;
  flDe: string;
  setFlDe: (v: string) => void;
  flAte: string;
  setFlAte: (v: string) => void;
  flQuery: string;
  setFlQuery: (v: string) => void;
  flSort: 'data' | 'valor';
  setFlSort: (v: 'data' | 'valor') => void;
  flDir: 'asc' | 'desc';
  setFlDir: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>;
  flStats: FlStats;
  filteredLancamentosList: LancamentoFinanceiro[];
  canWrite: boolean;
  onOpenEditExpenseModal: (l: LancamentoFinanceiro) => void;
  onDownloadCSV: () => void;
  lineName: (linhaId: string) => string;
}

export const FinanceiroLancamentosTab: React.FC<FinanceiroLancamentosTabProps> = ({
  allYears,
  allOrgsInLancamentos,
  flAno,
  setFlAno,
  flTri,
  setFlTri,
  flOrg,
  setFlOrg,
  flDe,
  setFlDe,
  flAte,
  setFlAte,
  flQuery,
  setFlQuery,
  flSort,
  setFlSort,
  flDir,
  setFlDir,
  flStats,
  filteredLancamentosList,
  canWrite,
  onOpenEditExpenseModal,
  onDownloadCSV,
  lineName,
}) => {
  return (
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
            <button type="button" className="btn sm" onClick={onDownloadCSV}>
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
                          onClick={() => onOpenEditExpenseModal(l)}
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
  );
};
