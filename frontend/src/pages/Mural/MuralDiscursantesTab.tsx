import React from 'react';
import { MuralData } from '../../types';

interface MuralDiscursantesTabProps {
  mural: MuralData;
  updateMural: (updater: (prev: MuralData) => MuralData) => void;
}

export const MuralDiscursantesTab: React.FC<MuralDiscursantesTabProps> = ({
  mural,
  updateMural,
}) => {
  return (
    <section className="card stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h3>Discursantes de {mural.mesAlmoco}</h3>
          <p className="sub">
            Os <b>{mural.discursantes.length} domingos</b> de {mural.mesAlmoco} são calculados automaticamente do calendário.
          </p>
        </div>
        <span className="badge badge-info">
          {mural.discursantes.length} domingos neste mês
        </span>
      </div>

      <div className="two" style={{ gap: 14 }}>
        {mural.discursantes.map((dom, idx) => (
          <div
            key={dom.data || idx}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              padding: 12,
              background: 'var(--color-surface-hover)',
            }}
            className="stack"
          >
            <div className="field">
              <label>
                {idx + 1}º Domingo — <b>{dom.data}</b>
              </label>
              <input
                className="inp"
                value={dom.data}
                readOnly
                style={{ opacity: 0.85, fontWeight: 700, cursor: 'default' }}
                title="Calculado automaticamente pelos domingos do mês selecionado"
              />
            </div>

            <div className="field">
              <label>Discursantes / Evento</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                {['Testemunhos', 'Conferência da Ala', 'Conferência Geral'].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    className="chip sm"
                    style={{ fontSize: 11, padding: '2px 8px' }}
                    onClick={() =>
                      updateMural(p => {
                        const list = [...p.discursantes];
                        list[idx] = { ...list[idx], nomes: preset };
                        return { ...p, discursantes: list };
                      })
                    }
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                className="inp"
                rows={3}
                value={dom.nomes}
                onChange={e => {
                  const val = e.target.value;
                  updateMural(p => {
                    const list = [...p.discursantes];
                    list[idx] = { ...list[idx], nomes: val };
                    return { ...p, discursantes: list };
                  });
                }}
                placeholder="Um nome por linha..."
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
