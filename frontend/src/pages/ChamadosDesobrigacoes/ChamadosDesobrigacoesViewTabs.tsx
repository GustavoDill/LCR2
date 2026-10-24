import React from 'react';
import { Icon } from '../../components/Icons';
import { ChamadosDesobrigacoesView } from './chamadosDesobrigacoesConstants';

interface ChamadosDesobrigacoesViewTabsProps {
  currentView: ChamadosDesobrigacoesView;
  setCurrentView: (view: ChamadosDesobrigacoesView) => void;
  openChamadosCount: number;
  vagasCount: number;
  openDesobCount: number;
  concluidosCount: number;
}

export const ChamadosDesobrigacoesViewTabs: React.FC<ChamadosDesobrigacoesViewTabsProps> = ({
  currentView,
  setCurrentView,
  openChamadosCount,
  vagasCount,
  openDesobCount,
  concluidosCount,
}) => {
  return (
    <div className="seg" role="tablist">
      <button
        type="button"
        className={currentView === 'novos' ? 'on' : ''}
        onClick={() => setCurrentView('novos')}
      >
        <Icon name="userplus" /> Chamados novos <span className="num" style={{ opacity: 0.7 }}>{openChamadosCount}</span>
      </button>

      <button
        type="button"
        className={currentView === 'vagos' ? 'on' : ''}
        onClick={() => setCurrentView('vagos')}
      >
        <Icon name="flag" /> Vagas na ala <span className="num" style={{ opacity: 0.7 }}>{vagasCount}</span>
      </button>

      <button
        type="button"
        className={currentView === 'desob' ? 'on' : ''}
        onClick={() => setCurrentView('desob')}
      >
        <Icon name="flag" /> Desobrigações <span className="num" style={{ opacity: 0.7 }}>{openDesobCount}</span>
      </button>

      <button
        type="button"
        className={currentView === 'feitos' ? 'on' : ''}
        onClick={() => setCurrentView('feitos')}
      >
        <Icon name="checks" /> Concluídos <span className="num" style={{ opacity: 0.7 }}>{concluidosCount}</span>
      </button>
    </div>
  );
};
