import React from 'react';

export type AtividadeTabKey = 'principal' | 'ajustes' | 'recusadas' | 'realizadas';

interface AtividadesFilterTabsProps {
  activeTab: AtividadeTabKey;
  setActiveTab: (tab: AtividadeTabKey) => void;
  ajustesCount: number;
  recusadasCount: number;
  realizadasCount: number;
  isBishopric: boolean;
  bishopricScope: 'todos' | 'meus';
  setBishopricScope: (scope: 'todos' | 'meus') => void;
  totalAtividadesCount: number;
  minhasAtividadesCount: number;
}

export const AtividadesFilterTabs: React.FC<AtividadesFilterTabsProps> = ({
  activeTab,
  setActiveTab,
  ajustesCount,
  recusadasCount,
  realizadasCount,
  isBishopric,
  bishopricScope,
  setBishopricScope,
  totalAtividadesCount,
  minhasAtividadesCount,
}) => {
  return (
    <div className="atv-tabs-bar">
      <div className="atv-tabs">
        <button
          type="button"
          className={`atv-tab ${activeTab === 'principal' ? 'active' : ''}`}
          onClick={() => setActiveTab('principal')}
        >
          Visão principal
        </button>
        <button
          type="button"
          className={`atv-tab ${activeTab === 'ajustes' ? 'active' : ''}`}
          onClick={() => setActiveTab('ajustes')}
        >
          Ajustes solicitados {ajustesCount}
        </button>
        <button
          type="button"
          className={`atv-tab ${activeTab === 'recusadas' ? 'active' : ''}`}
          onClick={() => setActiveTab('recusadas')}
        >
          Não aprovadas {recusadasCount}
        </button>
        <button
          type="button"
          className={`atv-tab ${activeTab === 'realizadas' ? 'active' : ''}`}
          onClick={() => setActiveTab('realizadas')}
        >
          Já realizadas {realizadasCount}
        </button>
      </div>

      {isBishopric && (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Visualizar:</span>
          <button
            type="button"
            className={`atv-tab sm ${bishopricScope === 'todos' ? 'active' : ''}`}
            style={{ padding: '3px 10px', fontSize: '11.5px' }}
            onClick={() => setBishopricScope('todos')}
          >
            Todos da Ala ({totalAtividadesCount})
          </button>
          <button
            type="button"
            className={`atv-tab sm ${bishopricScope === 'meus' ? 'active' : ''}`}
            style={{ padding: '3px 10px', fontSize: '11.5px' }}
            onClick={() => setBishopricScope('meus')}
          >
            Minhas ({minhasAtividadesCount})
          </button>
        </div>
      )}
    </div>
  );
};
