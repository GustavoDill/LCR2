import React from 'react';

interface AtividadesStatsCardsProps {
  aguardandoCount: number;
  countMenosDe2Semanas: number;
  aprovadasProximasCount: number;
  ajustesCount: number;
  totalCustoAprovadas: number;
  aprovadasComCustoCount: number;
}

export const AtividadesStatsCards: React.FC<AtividadesStatsCardsProps> = ({
  aguardandoCount,
  countMenosDe2Semanas,
  aprovadasProximasCount,
  ajustesCount,
  totalCustoAprovadas,
  aprovadasComCustoCount,
}) => {
  return (
    <div className="atv-stats">
      {/* Card 1: Aguardando aprovação */}
      <div className="atv-stat-card red">
        <div className="atv-stat-title">Aguardando aprovação</div>
        <div className="atv-stat-val">{aguardandoCount}</div>
        <div className="atv-stat-sub">
          {countMenosDe2Semanas} com menos de 2 semanas
        </div>
      </div>

      {/* Card 2: Aprovadas · próximas */}
      <div className="atv-stat-card green">
        <div className="atv-stat-title">Aprovadas · próximas</div>
        <div className="atv-stat-val">{aprovadasProximasCount}</div>
        <div className="atv-stat-sub">confirmadas</div>
      </div>

      {/* Card 3: Ajustes solicitados */}
      <div className="atv-stat-card blue">
        <div className="atv-stat-title">Ajustes solicitados</div>
        <div className="atv-stat-val">{ajustesCount}</div>
        <div className="atv-stat-sub">aguardando a organização</div>
      </div>

      {/* Card 4: Custo previsto (aprovadas) */}
      <div className="atv-stat-card green">
        <div className="atv-stat-title">Custo previsto (aprovadas)</div>
        <div className="atv-stat-val">
          R$ {totalCustoAprovadas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="atv-stat-sub">
          {aprovadasComCustoCount} com custo
        </div>
      </div>
    </div>
  );
};
