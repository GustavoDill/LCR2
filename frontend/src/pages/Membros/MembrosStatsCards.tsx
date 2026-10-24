import React from 'react';

interface MembrosStatsCardsProps {
  totalMembers: number;
  metaTotal?: number;
  totalAdultos: number;
  totalJovens: number;
  totalCriancas: number;
  semChamado: number;
}

export const MembrosStatsCards: React.FC<MembrosStatsCardsProps> = ({
  totalMembers,
  metaTotal,
  totalAdultos,
  totalJovens,
  totalCriancas,
  semChamado,
}) => {
  return (
    <div className="stats">
      <div className="stat">
        <div className="v num">{totalMembers}</div>
        <div className="l">membros na lista</div>
        <div className="x">{metaTotal ? `total: ${metaTotal}` : 'cadastro regular'}</div>
      </div>

      <div className="stat">
        <div className="v num">{totalAdultos}</div>
        <div className="l">adultos</div>
        <div className="x">{totalJovens} jovens · {totalCriancas} crianças</div>
      </div>

      <div className="stat">
        <div className="v num">{semChamado}</div>
        <div className="l">adultos sem chamado</div>
        <div className="x">possíveis indicações</div>
      </div>
    </div>
  );
};
