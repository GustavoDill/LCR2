import React from 'react';

interface ChamadosStatsCardsProps {
  totalCargos: number;
  suborgsCount: number;
  preenchidos: number;
  vagos: number;
  trocas: number;
}

export const ChamadosStatsCards: React.FC<ChamadosStatsCardsProps> = ({
  totalCargos,
  suborgsCount,
  preenchidos,
  vagos,
  trocas,
}) => {
  return (
    <div className="ch-stats stats">
      <div className="ch-stat-card stat">
        <div className="v num">{totalCargos}</div>
        <div className="l">chamados na lista</div>
        <div className="x">{suborgsCount} organizações</div>
      </div>

      <div className="ch-stat-card stat">
        <div className="v num" style={{ color: '#2dd4bf' }}>{preenchidos}</div>
        <div className="l">preenchidos</div>
        <div className="x">{totalCargos ? Math.round((preenchidos / totalCargos) * 100) : 0}% da lista</div>
      </div>

      <div className="ch-stat-card stat">
        <div className="v num" style={{ color: '#f87171' }}>{vagos}</div>
        <div className="l">vagos</div>
        <div className="x">possíveis indicações</div>
      </div>

      <div className="ch-stat-card stat">
        <div className="v num" style={{ color: '#fbbf24' }}>{trocas}</div>
        <div className="l">trocas em andamento</div>
        <div className="x">&nbsp;</div>
      </div>
    </div>
  );
};
