import React from 'react';
import { SIRAluno } from '../../types';
import { SeminarioFilter, SEMINARIO_FILTERS } from './seminarioConstants';

interface SeminarioTableProps {
  filteredAlunos: SIRAluno[];
  activeFilter: SeminarioFilter;
  setActiveFilter: (filter: SeminarioFilter) => void;
  counts: Record<SeminarioFilter, number>;
}

export const SeminarioTable: React.FC<SeminarioTableProps> = ({
  filteredAlunos,
  activeFilter,
  setActiveFilter,
  counts,
}) => {
  return (
    <>
      {/* Filter Chips */}
      <div className="chips" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {SEMINARIO_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`chip ${activeFilter === key ? 'on' : ''}`}
            onClick={() => setActiveFilter(key)}
          >
            {label} <span className="c num">{counts[key]}</span>
          </button>
        ))}
      </div>

      {/* Students Table */}
      <div className="tscroll">
        <table>
          <thead>
            <tr>
              <th>SITUAÇÃO</th>
              <th>ALUNO</th>
              <th>TIPO</th>
              <th>FREQ.</th>
              <th>LEITURA</th>
              <th style={{ textAlign: 'right' }}>AULAS A RECUPERAR</th>
              <th>AVALIAÇÃO</th>
              <th style={{ textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredAlunos.length ? (
              filteredAlunos.map((aluno, i) => {
                const isLow = aluno.freq != null && aluno.freq < 75;
                const isInstituto = /inst/i.test(aluno.tipo);

                return (
                  <tr key={i}>
                    <td>
                      <span className={`sit sit-${aluno.situacao}`}>
                        {aluno.situacao === 'credito'
                          ? 'Crédito'
                          : aluno.situacao === 'risco'
                          ? 'Em risco'
                          : 'Pendência'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{aluno.nome}</td>
                    <td>
                      <span className={isInstituto ? 'tag-instituto' : 'tag-seminario'}>
                        {aluno.tipo.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`fbar ${isLow ? 'low' : ''}`}>
                        <s>
                          <i style={{ width: `${Math.min(100, aluno.freq || 0)}%` }} />
                        </s>
                        <span>{aluno.freq != null ? `${aluno.freq}%` : '—'}</span>
                      </span>
                    </td>
                    <td className={aluno.leitura != null && aluno.leitura < 75 ? 'late-txt' : ''}>
                      {aluno.leitura != null ? `${aluno.leitura}%` : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {aluno.aulas != null ? aluno.aulas : '—'}
                    </td>
                    <td className={/n[aã]o/i.test(aluno.avaliacao || '') ? 'late-txt' : ''}>
                      {aluno.avaliacao || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() => {
                          alert(`Acompanhamento pastoral de ${aluno.nome}`);
                        }}
                      >
                        Acompanhar
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '16px 0', color: 'var(--muted)' }}>
                  Nenhum aluno com este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
