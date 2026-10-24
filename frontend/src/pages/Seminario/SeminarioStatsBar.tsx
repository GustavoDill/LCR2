import React from 'react';

interface SeminarioStatsBarProps {
  totalAlunos: number;
  numSeminario: number;
  numInstituto: number;
  countCredito: number;
  countPendencia: number;
  countRisco: number;
}

export const SeminarioStatsBar: React.FC<SeminarioStatsBarProps> = ({
  totalAlunos,
  numSeminario,
  numInstituto,
  countCredito,
  countPendencia,
  countRisco,
}) => {
  return (
    <>
      {/* 4 Stat Boxes */}
      <div className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
        <div className="stat" style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8 }}>
          <div className="v num" style={{ fontSize: '26px', fontWeight: 700 }}>
            {totalAlunos}
          </div>
          <div className="l" style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
            alunos
          </div>
          <div className="x" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 2 }}>
            {numSeminario} no Seminário · {numInstituto} no Instituto
          </div>
        </div>

        <div className="stat" style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8 }}>
          <div className="v num" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--cons, #10b981)' }}>
            {countCredito}
          </div>
          <div className="l" style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
            com crédito
          </div>
        </div>

        <div className="stat" style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8 }}>
          <div className="v num" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--warn, #f59e0b)' }}>
            {countPendencia}
          </div>
          <div className="l" style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
            com pendência
          </div>
        </div>

        <div className="stat" style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8 }}>
          <div className="v num" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--crit, #ef4444)' }}>
            {countRisco}
          </div>
          <div className="l" style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
            em risco
          </div>
        </div>
      </div>

      {/* Distribution bar */}
      {totalAlunos > 0 && (
        <div
          className="dist"
          role="img"
          aria-label={`${countCredito} com crédito, ${countPendencia} com pendência, ${countRisco} em risco`}
        >
          {countCredito > 0 && (
            <i
              className="d-cred"
              style={{ width: `${(countCredito / totalAlunos) * 100}%` }}
              title={`Crédito: ${countCredito}`}
            />
          )}
          {countPendencia > 0 && (
            <i
              className="d-pend"
              style={{ width: `${(countPendencia / totalAlunos) * 100}%` }}
              title={`Pendência: ${countPendencia}`}
            />
          )}
          {countRisco > 0 && (
            <i
              className="d-risco"
              style={{ width: `${(countRisco / totalAlunos) * 100}%` }}
              title={`Em risco: ${countRisco}`}
            />
          )}
        </div>
      )}

      {/* Legend */}
      <div className="legend">
        <span>
          <i className="d-cred" /> Crédito
        </span>
        <span>
          <i className="d-pend" /> Pendência
        </span>
        <span>
          <i className="d-risco" /> Em risco
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '12px' }}>
          Para crédito: 75% de frequência · leitura 75% · 100% nas Obras-Padrão
        </span>
      </div>
    </>
  );
};
