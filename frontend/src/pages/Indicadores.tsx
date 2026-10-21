import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { IndicadorMensal } from '../types';

export const IND = [
  { key: 'sacramental', title: 'Reunião sacramental', sub: 'participantes (média)' },
  { key: 'jovens', title: 'Jovens', sub: 'frequência (média)' },
  { key: 'primaria', title: 'Primária', sub: 'frequência (média)' },
  { key: 'ensinados', title: 'Missionário', sub: 'pessoas sendo ensinadas' },
  { key: 'retorno', title: 'Retorno', sub: 'membros acompanhados' },
  { key: 'templo', title: 'Templo', sub: 'recomendações ativas' },
  { key: 'ministracao', title: 'Ministração', sub: 'contatos no mês' },
  { key: 'ordenancas', title: 'Ordenanças', sub: 'pessoas em preparação' },
  { key: 'ensino', title: 'Ensino', sub: 'professores preparados' },
  { key: 'servico', title: 'Serviço', sub: 'projetos realizados' },
  { key: 'autossuf', title: 'Autossuficiência', sub: 'pessoas apoiadas' },
] as const;

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

const MESES_ABREV = [
  'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT'
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return `${MESES[(m || 1) - 1]} ${y}`;
}

function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export const Indicadores: React.FC = () => {
  const { canWrite } = useAuth();
  
  // Default to 2026-10 to match reference information, or fallback to current month
  const [currentMonth, setCurrentMonth] = useState('2026-10');
  const [allIndicadores, setAllIndicadores] = useState<Record<string, IndicadorMensal>>({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Debounce timers for field saving
  const saveTimersRef = useRef<Record<string, any>>({});

  const currentData = useMemo(() => {
    return allIndicadores[currentMonth] || { id: currentMonth, mes: currentMonth };
  }, [allIndicadores, currentMonth]);

  const last6Months = useMemo(() => {
    return [5, 4, 3, 2, 1, 0].map(n => shiftMonth(currentMonth, -n));
  }, [currentMonth]);

  useEffect(() => {
    loadIndicadores();
  }, []);

  async function loadIndicadores() {
    try {
      setLoading(true);
      const data = await api.get<Record<string, IndicadorMensal>>('/indicadores');
      if (data && typeof data === 'object') {
        setAllIndicadores(data);
      }
    } catch (err) {
      console.error('Erro ao carregar indicadores:', err);
    } finally {
      setLoading(false);
    }
  }

  const saveFieldToBackend = useCallback(async (key: string, val: number | null) => {
    try {
      setSaveStatus('Salvando…');
      await api.post(`/indicadores/${currentMonth}`, { key, value: val });
      setSaveStatus('Salvo');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      console.error(`Erro ao salvar indicador ${key}:`, err);
      setSaveStatus('Erro ao salvar');
      setTimeout(() => setSaveStatus(null), 3500);
    }
  }, [currentMonth]);

  const handleInputChange = (key: string, rawVal: string) => {
    const val = rawVal === '' ? null : Number(rawVal);
    if (rawVal !== '' && isNaN(val as number)) return;

    // Immediate optimistic update in state
    setAllIndicadores(prev => ({
      ...prev,
      [currentMonth]: {
        ...(prev[currentMonth] || { id: currentMonth, mes: currentMonth }),
        [key]: val,
      },
    }));

    // Debounced network save
    if (saveTimersRef.current[key]) {
      clearTimeout(saveTimersRef.current[key]);
    }
    saveTimersRef.current[key] = setTimeout(() => {
      saveFieldToBackend(key, val);
    }, 400);
  };

  const handleInputBlur = (key: string) => {
    if (saveTimersRef.current[key]) {
      clearTimeout(saveTimersRef.current[key]);
      const val = allIndicadores[currentMonth]?.[key] ?? null;
      saveFieldToBackend(key, val);
    }
  };

  const renderSpark = (vals: (number | null | undefined)[]) => {
    const pts: [number, number][] = vals
      .map((v, i) => [i, v] as [number, number | null | undefined])
      .filter((p): p is [number, number] => p[1] != null && !isNaN(p[1]));

    if (pts.length < 2) {
      return <span style={{ color: 'var(--muted)' }}>—</span>;
    }

    const w = 84;
    const h = 26;
    const numVals = pts.map(p => p[1]);
    const mx = Math.max(...numVals);
    const mn = Math.min(...numVals);
    const rg = mx - mn || 1;
    const X = (i: number) => (2 + (i * (w - 4)) / (vals.length - 1)).toFixed(1);
    const Y = (v: number) => (h - 3 - ((v - mn) / rg) * (h - 6)).toFixed(1);

    const line = pts.map(p => `${X(p[0])},${Y(p[1])}`).join(' ');
    const l = pts[pts.length - 1];

    return (
      <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <polygon
          className="ar"
          points={`${X(pts[0][0])},${h} ${line} ${X(l[0])},${h}`}
        />
        <polyline className="ln" points={line} />
        <circle className="dt" cx={X(l[0])} cy={Y(l[1])} r="2.6" />
      </svg>
    );
  };

  if (loading && Object.keys(allIndicadores).length === 0) {
    return <div className="empty">Carregando painel de saúde da ala…</div>;
  }

  return (
    <div className="stack t-indicadores">
      {/* Header matching Claude artifact */}
      <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 className="with-ico" style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
            <span
              className="h-ico"
              style={{
                display: 'inline-grid',
                placeItems: 'center',
                width: 36,
                height: 36,
                borderRadius: 10,
                color: 'var(--tc, #4ade80)',
                background: 'color-mix(in srgb, var(--tc, #4ade80) 14%, transparent)',
                marginRight: 10,
              }}
            >
              <svg
                className="ico"
                viewBox="0 0 24 24"
                width={20}
                height={20}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </span>
            Painel de saúde da ala
          </h2>
          <p className="sub" style={{ margin: '6px 0 0 0', color: 'var(--muted)', fontSize: '13.5px' }}>
            Preencha uma vez por mês para transformar o Conselho da Ala de uma reunião de relatórios em uma reunião de ação.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saveStatus && (
            <span style={{ fontSize: '12px', color: saveStatus.includes('Erro') ? 'var(--crit)' : 'var(--cons)', fontWeight: 600 }}>
              {saveStatus}
            </span>
          )}

          <div className="mnav">
            <button
              type="button"
              className="btn sm"
              onClick={() => setCurrentMonth(prev => shiftMonth(prev, -1))}
              aria-label="Mês anterior"
            >
              ‹
            </button>
            <span className="m">{monthLabel(currentMonth)}</span>
            <button
              type="button"
              className="btn sm"
              onClick={() => setCurrentMonth(prev => shiftMonth(prev, 1))}
              aria-label="Próximo mês"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Grid of 11 Cards matching the reference screenshot */}
      <div className="igrid">
        {IND.map(item => {
          const val = currentData[item.key];
          return (
            <label className="icell" key={item.key} htmlFor={`ind-${item.key}`}>
              <span className="a">{item.title}</span>
              <span className="b">{item.sub}</span>
              <input
                className="inp"
                type="number"
                inputMode="numeric"
                min="0"
                id={`ind-${item.key}`}
                value={val != null ? val : ''}
                placeholder="—"
                disabled={!canWrite}
                onChange={e => handleInputChange(item.key, e.target.value)}
                onBlur={() => handleInputBlur(item.key)}
              />
            </label>
          );
        })}
      </div>

      {/* Last 6 Months Table */}
      <div style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: '18px', marginBottom: '10px', color: 'var(--ink)' }}>Últimos 6 meses</h3>
        <div className="tscroll">
          <table>
            <thead>
              <tr>
                <th>INDICADOR</th>
                {last6Months.map(m => {
                  const mm = parseInt(m.split('-')[1], 10);
                  const abrev = MESES[mm - 1]?.slice(0, 3).toUpperCase() || '—';
                  return <th key={m}>{abrev}</th>;
                })}
                <th>TENDÊNCIA</th>
              </tr>
            </thead>
            <tbody>
              {IND.map(item => {
                const vals = last6Months.map(m => {
                  const mData = allIndicadores[m];
                  return mData && mData[item.key] != null ? Number(mData[item.key]) : null;
                });

                return (
                  <tr key={item.key}>
                    <td>{item.title}</td>
                    {vals.map((v, i) => (
                      <td key={last6Months[i]} className={i === 5 ? 'cur' : ''}>
                        {v != null ? v : '—'}
                      </td>
                    ))}
                    <td>{renderSpark(vals)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
