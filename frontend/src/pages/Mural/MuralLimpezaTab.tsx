import React from 'react';
import { MuralData } from '../../types';

interface MuralLimpezaTabProps {
  mural: MuralData;
  updateMural: (updater: (prev: MuralData) => MuralData) => void;
}

export const MuralLimpezaTab: React.FC<MuralLimpezaTabProps> = ({
  mural,
  updateMural,
}) => {
  return (
    <section className="card stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3>Limpeza da Capela & Pão do Sacramento</h3>
          <p className="sub">
            Defina se a limpeza é realizada por uma Ala inteira (ex: <b>Ala Planaltina</b>) ou dividida por setores.
          </p>
        </div>
      </div>

      {/* Seletor de Modo de Limpeza */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 8,
          background: 'var(--color-primary-light)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, cursor: 'pointer' }}>
            <input
              type="radio"
              name="modoLimpeza"
              value="ala_unica"
              checked={mural.modoLimpeza === 'ala_unica'}
              onChange={() => updateMural(p => ({ ...p, modoLimpeza: 'ala_unica' }))}
            />
            🏛️ Ala Única / Responsável Geral
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, cursor: 'pointer' }}>
            <input
              type="radio"
              name="modoLimpeza"
              value="setores"
              checked={mural.modoLimpeza !== 'ala_unica'}
              onChange={() => updateMural(p => ({ ...p, modoLimpeza: 'setores' }))}
            />
            🧹 Por Setores Detalhados
          </label>
        </div>

        {mural.modoLimpeza === 'ala_unica' ? (
          <div style={{ display: 'flex', gap: 6 }}>
            {['Ala Planaltina', 'Ala Bosque Sagrado', 'Ala Centro'].map(preset => (
              <button
                key={preset}
                type="button"
                className="chip sm"
                onClick={() => updateMural(p => ({ ...p, limpezaAlaUnica: preset }))}
              >
                {preset}
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            className="btn ghost sm"
            onClick={() =>
              updateMural(p => ({
                ...p,
                limpezaCapela: [...p.limpezaCapela, { responsavel: '', local: '' }],
              }))
            }
          >
            + Adicionar setor
          </button>
        )}
      </div>

      {/* MODO ALA ÚNICA */}
      {mural.modoLimpeza === 'ala_unica' ? (
        <div className="field" style={{ marginTop: 8 }}>
          <label>Ala ou Responsável Geral pela Limpeza</label>
          <input
            className="inp"
            value={mural.limpezaAlaUnica || ''}
            onChange={e => updateMural(p => ({ ...p, limpezaAlaUnica: e.target.value }))}
            placeholder="Ex.: Ala Planaltina"
            style={{ fontSize: '1.05rem', fontWeight: 700 }}
          />
          <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: 4 }}>
            No cartaz, o nome será exibido centralizado com destaque abaixo de "Limpeza da Capela", exatamente como no modelo (ex.: <em>Ala Planaltina</em>).
          </small>
        </div>
      ) : (
        /* MODO POR SETORES */
        <div className="stack" style={{ gap: 8, marginTop: 8 }}>
          {mural.limpezaCapela.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <input
                className="inp"
                list="mural-membros-list"
                value={item.responsavel}
                onChange={e => {
                  const val = e.target.value;
                  updateMural(p => {
                    const list = [...p.limpezaCapela];
                    list[idx] = { ...list[idx], responsavel: val };
                    return { ...p, limpezaCapela: list };
                  });
                }}
                placeholder="Responsável (ex.: Mariano ou --------)"
              />
              <input
                className="inp"
                value={item.local}
                onChange={e => {
                  const val = e.target.value;
                  updateMural(p => {
                    const list = [...p.limpezaCapela];
                    list[idx] = { ...list[idx], local: val };
                    return { ...p, limpezaCapela: list };
                  });
                }}
                placeholder="Setor (ex.: Salão Cultural)"
              />
              <button
                type="button"
                className="btn ghost danger sm"
                onClick={() =>
                  updateMural(p => ({
                    ...p,
                    limpezaCapela: p.limpezaCapela.filter((_, i) => i !== idx),
                  }))
                }
                title="Remover setor"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="field" style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
        <label>🍞 Responsável pelo Pão do Sacramento</label>
        <input
          className="inp"
          list="mural-membros-list"
          value={mural.paoSacramento}
          onChange={e => updateMural(p => ({ ...p, paoSacramento: e.target.value }))}
          placeholder="Ex.: Irmã Soeli"
        />
      </div>
    </section>
  );
};
