import React from 'react';
import { IconSparkles } from '../../components/Icons';
import { NatalTab } from './natalConstants';

interface NatalTabsProps {
  currentTab: NatalTab;
  onTabChange: (tab: NatalTab) => void;
  tarefasCount: number;
  gastosCount: number;
}

export const NatalTabs: React.FC<NatalTabsProps> = ({
  currentTab,
  onTabChange,
  tarefasCount,
  gastosCount,
}) => {
  return (
    <div style={{ display: 'flex', gap: 8, margin: '24px 0 16px 0', borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>
      <button
        className={`btn ${currentTab === 'tarefas' ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => onTabChange('tarefas')}
      >
        Checklist de Tarefas ({tarefasCount})
      </button>
      <button
        className={`btn ${currentTab === 'financeiro' ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => onTabChange('financeiro')}
      >
        Orçamento & Despesas ({gastosCount})
      </button>
      <button
        className={`btn ${currentTab === 'ideias' ? 'btn-secondary' : 'btn-ghost'}`}
        onClick={() => onTabChange('ideias')}
      >
        <IconSparkles size={16} /> Ideias e Configurações
      </button>
    </div>
  );
};
