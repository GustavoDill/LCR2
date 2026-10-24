import React from 'react';

export type ChamadosFilterType = 'todos' | 'vagos' | 'troca';

interface ChamadosSearchBarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterType: ChamadosFilterType;
  setFilterType: (v: ChamadosFilterType) => void;
  totalCargos: number;
  vagos: number;
  trocas: number;
}

export const ChamadosSearchBar: React.FC<ChamadosSearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  totalCargos,
  vagos,
  trocas,
}) => {
  return (
    <div className="ch-searchbar searchbar">
      <div className="ch-search-input-wrap">
        <input
          className="ch-search-input inp"
          type="search"
          placeholder="Buscar por nome, chamado ou organização"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="ch-filter-chips chips">
        {(
          [
            ['todos', 'Todos', totalCargos],
            ['vagos', 'Vagos', vagos],
            ['troca', 'Em troca', trocas],
          ] as const
        ).map(([val, label, n]) => (
          <button
            key={val}
            type="button"
            className={`ch-chip chip ${filterType === val ? 'on' : ''}`}
            onClick={() => setFilterType(val)}
          >
            {label} <span className="c num">{n}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
