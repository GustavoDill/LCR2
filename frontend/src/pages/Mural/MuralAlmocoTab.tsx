import React from 'react';
import { MuralData } from '../../types';

interface MuralAlmocoTabProps {
  mural: MuralData;
  updateMural: (updater: (prev: MuralData) => MuralData) => void;
  onFillCurrentWeek: () => void;
}

export const MuralAlmocoTab: React.FC<MuralAlmocoTabProps> = ({
  mural,
  updateMural,
  onFillCurrentWeek,
}) => {
  return (
    <section className="card stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3>Almoço das Sisteres</h3>
          <p className="sub">Defina os dias da semana e as famílias responsáveis pelo almoço das missionárias.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary sm"
            onClick={onFillCurrentWeek}
            title="Preenche automaticamente os 7 dias da semana atual (Segunda a Domingo, com Segunda como P-Day)"
          >
            📅 Preencher Semana Atual
          </button>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() =>
              updateMural(p => ({
                ...p,
                almocoSisteres: [
                  ...p.almocoSisteres,
                  { dia: 'Dia ', diaSemana: 'Quinta', responsavel: '', destaque: false },
                ],
              }))
            }
          >
            + Adicionar dia
          </button>
        </div>
      </div>

      <div
        style={{
          padding: '10px 14px',
          borderRadius: 8,
          background: 'var(--color-primary-light)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ fontSize: '0.85rem' }}>
          <strong>Semana Completa (Segunda a Domingo):</strong> Segunda-feira é o 1º dia como <em>P-Day</em>.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean(mural.mostrarMesAlmoco)}
              onChange={e => updateMural(p => ({ ...p, mostrarMesAlmoco: e.target.checked }))}
            />
            Exibir mês no cartaz ({mural.mesAlmoco})
          </label>
          <span className="badge badge-info">
            {mural.almocoSisteres.length} dias configurados
          </span>
        </div>
      </div>

      <div className="stack" style={{ gap: 10 }}>
        {mural.almocoSisteres.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1.6fr auto auto',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <input
              className="inp"
              value={item.dia}
              onChange={e => {
                const val = e.target.value;
                updateMural(p => {
                  const list = [...p.almocoSisteres];
                  list[idx] = { ...list[idx], dia: val };
                  return { ...p, almocoSisteres: list };
                });
              }}
              placeholder="Ex.: Dia 19"
            />
            <input
              className="inp"
              value={item.diaSemana}
              onChange={e => {
                const val = e.target.value;
                updateMural(p => {
                  const list = [...p.almocoSisteres];
                  list[idx] = { ...list[idx], diaSemana: val };
                  return { ...p, almocoSisteres: list };
                });
              }}
              placeholder="Ex.: Segunda"
            />
            <input
              className="inp"
              list="mural-membros-list"
              value={item.responsavel}
              onChange={e => {
                const val = e.target.value;
                updateMural(p => {
                  const list = [...p.almocoSisteres];
                  list[idx] = { ...list[idx], responsavel: val };
                  return { ...p, almocoSisteres: list };
                });
              }}
              placeholder="Família / Membro ou P-Day"
            />
            <label
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}
              title="Destacar linha com faixa amarela"
            >
              <input
                type="checkbox"
                checked={Boolean(item.destaque)}
                onChange={e => {
                  const checked = e.target.checked;
                  updateMural(p => {
                    const list = [...p.almocoSisteres];
                    list[idx] = { ...list[idx], destaque: checked };
                    return { ...p, almocoSisteres: list };
                  });
                }}
              />
              Faixa
            </label>
            <button
              type="button"
              className="btn ghost danger sm"
              onClick={() =>
                updateMural(p => ({
                  ...p,
                  almocoSisteres: p.almocoSisteres.filter((_, i) => i !== idx),
                }))
              }
              title="Remover dia"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
