import React from 'react';

interface ChamadosDesobrigacoesStatsCardsProps {
  openChamadosCount: number;
  aguardandoAprovacaoCount: number;
  vagasCount: number;
  vagasComIndicacaoCount: number;
  openDesobCount: number;
  desobConversadasCount: number;
  lateCount: number;
}

export const ChamadosDesobrigacoesStatsCards: React.FC<ChamadosDesobrigacoesStatsCardsProps> = ({
  openChamadosCount,
  aguardandoAprovacaoCount,
  vagasCount,
  vagasComIndicacaoCount,
  openDesobCount,
  desobConversadasCount,
  lateCount,
}) => {
  return (
    <div className="kgrid">
      <div className="kcard">
        <h4>Chamados em andamento</h4>
        <div className="kbody">
          <span className="kval">{openChamadosCount}</span>
        </div>
        <div className="ksub">
          {aguardandoAprovacaoCount} aguardando aprovação
        </div>
      </div>

      <div className="kcard">
        <h4>Vagas abertas</h4>
        <div className="kbody">
          <span className={`kval ${vagasCount ? 's-crit' : ''}`}>{vagasCount}</span>
        </div>
        <div className="ksub">
          {vagasComIndicacaoCount} com indicação em andamento
        </div>
      </div>

      <div className="kcard">
        <h4>Desobrigações pendentes</h4>
        <div className="kbody">
          <span className={`kval ${openDesobCount ? 's-norm' : ''}`}>{openDesobCount}</span>
        </div>
        <div className="ksub">
          {desobConversadasCount} já conversadas
        </div>
      </div>

      <div className="kcard">
        <h4>Ações vencidas</h4>
        <div className="kbody">
          <span className={`kval ${lateCount ? 's-crit' : 's-exc'}`}>{lateCount}</span>
        </div>
        <div className={`ksub ${lateCount ? 's-crit' : ''}`}>
          {lateCount ? 'prazo passou' : 'tudo em dia'}
        </div>
      </div>
    </div>
  );
};
