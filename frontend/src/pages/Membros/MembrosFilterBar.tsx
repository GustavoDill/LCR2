import React from 'react';

export type GenderFilter = 'todos' | 'M' | 'F';
export type CategoryFilter = 'todos' | 'adultos' | 'jovens' | 'criancas' | 'semchamado';

interface MembrosFilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  genderFilter: GenderFilter;
  setGenderFilter: (v: GenderFilter) => void;
  categoryFilter: CategoryFilter;
  setCategoryFilter: (v: CategoryFilter) => void;
  totalMembers: number;
  totalAdultos: number;
  totalJovens: number;
  totalCriancas: number;
  semChamado: number;
}

export const MembrosFilterBar: React.FC<MembrosFilterBarProps> = ({
  search,
  setSearch,
  genderFilter,
  setGenderFilter,
  categoryFilter,
  setCategoryFilter,
  totalMembers,
  totalAdultos,
  totalJovens,
  totalCriancas,
  semChamado,
}) => {
  return (
    <>
      <div className="searchbar">
        <input
          className="inp"
          type="search"
          placeholder="Buscar por nome, chamado ou telefone"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="chips">
          {(
            [
              ['todos', 'Todos'],
              ['M', 'Homens'],
              ['F', 'Mulheres'],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              className={`chip ${genderFilter === val ? 'on' : ''}`}
              onClick={() => setGenderFilter(val)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="chips">
        {(
          [
            ['todos', 'Todos', totalMembers],
            ['adultos', 'Adultos', totalAdultos],
            ['jovens', 'Jovens 12–17', totalJovens],
            ['criancas', 'Crianças', totalCriancas],
            ['semchamado', 'Adultos sem chamado', semChamado],
          ] as const
        ).map(([val, label, n]) => (
          <button
            key={val}
            type="button"
            className={`chip ${categoryFilter === val ? 'on' : ''}`}
            onClick={() => setCategoryFilter(val)}
          >
            {label} <span className="c num">{n}</span>
          </button>
        ))}
      </div>
    </>
  );
};
