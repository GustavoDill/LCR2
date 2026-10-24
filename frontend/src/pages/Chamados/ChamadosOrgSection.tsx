import React from 'react';
import { Cargo, Organizacao } from '../../types';
import { renderSubOrgIcon } from './chamadosIcons';
import { ChamadosFilterType } from './ChamadosSearchBar';

interface ChamadosOrgSectionProps {
  group: { nome: string; suborgs: Organizacao[] };
  searchQuery: string;
  filterType: ChamadosFilterType;
  canWrite: boolean;
  onOpenAddSubOrgModal: (orgNome: string) => void;
  onDeleteOrg: (orgNome: string) => void;
  onDeleteSubOrg: (suborg: Organizacao) => void;
  onOpenAddCargoModal: (suborg: Organizacao) => void;
  onOpenSwapModal: (suborg: Organizacao, cargo: Cargo, defaultModo: 'agora' | 'processo') => void;
  onDeleteCargo: (suborgId: string, cargoId: string, cargoTitulo: string) => void;
  onApplyPending: (suborgId: string, cargoId: string) => void;
}

export const ChamadosOrgSection: React.FC<ChamadosOrgSectionProps> = ({
  group,
  searchQuery,
  filterType,
  canWrite,
  onOpenAddSubOrgModal,
  onDeleteOrg,
  onDeleteSubOrg,
  onOpenAddCargoModal,
  onOpenSwapModal,
  onDeleteCargo,
  onApplyPending,
}) => {
  const q = searchQuery.toLowerCase().trim();

  const matchFilter = (c: Cargo, suborg: Organizacao, orgNome: string) => {
    if (filterType === 'vagos' && (c.pessoa || c.fixo)) return false;
    if (filterType === 'troca' && !c.pendente) return false;
    if (q) {
      const txt = `${c.titulo} ${c.pessoa || ''} ${suborg.nome} ${orgNome} ${c.pendente?.pessoa || ''}`.toLowerCase();
      if (!txt.includes(q)) return false;
    }
    return true;
  };

  const matchingSuborgs = group.suborgs
    .map(suborg => {
      const matchedCargos = (suborg.cargos || []).filter(c => matchFilter(c, suborg, group.nome));
      return { suborg, matchedCargos };
    })
    .filter(({ matchedCargos }) => {
      if (searchQuery || filterType !== 'todos') {
        return matchedCargos.length > 0;
      }
      return true;
    });

  if (matchingSuborgs.length === 0 && (searchQuery || filterType !== 'todos')) {
    return null;
  }

  return (
    <section className="ch-org-section">
      {/* Level 1: Organization Header */}
      <div className="ch-gh">
        <h3 className="ch-gh-title">{group.nome}</h3>
        {canWrite && (
          <div className="ch-gh-actions">
            <button
              type="button"
              className="btn-add-suborg"
              onClick={() => onOpenAddSubOrgModal(group.nome)}
              title={`Adicionar suborganização em ${group.nome}`}
            >
              + Suborganização
            </button>
            <button
              type="button"
              className="btn-del-org"
              onClick={() => onDeleteOrg(group.nome)}
              title={`Excluir organização ${group.nome}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Level 2: Suborganizations Grid */}
      {matchingSuborgs.length === 0 ? (
        <div className="ch-empty-org">Nenhuma suborganização cadastrada ainda. Toque em “+ Suborganização” acima.</div>
      ) : (
        <div className="ch-grid">
          {matchingSuborgs.map(({ suborg, matchedCargos }) => {
            const allSubCargos = suborg.cargos || [];
            const fill = allSubCargos.filter(c => c.pessoa).length;

            return (
              <article key={suborg.id} className="card ch-org">
                {/* Suborg Card Header */}
                <div className="ch-oh">
                  <div className="ch-oh-left">
                    <span className="ch-suborg-icon">{renderSubOrgIcon(suborg.nome)}</span>
                    <h3>{suborg.nome}</h3>
                  </div>

                  <div className="ch-oh-right">
                    <span className="ch-suborg-count row-m num">{fill} de {allSubCargos.length}</span>
                    {canWrite && (
                      <button
                        type="button"
                        className="btn-del-suborg"
                        onClick={() => onDeleteSubOrg(suborg)}
                        title={`Excluir suborganização ${suborg.nome}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Cyan accent line */}
                  <div className="ch-accent-line" />
                </div>

                {/* Level 3: Chamados List */}
                <div className="ch-list list">
                  {matchedCargos.map(cargo => {
                    const isVago = !cargo.pessoa && !cargo.fixo;
                    return (
                      <div key={cargo.id} className={`ch-row ${isVago ? 'vago' : ''}`}>
                        <div className="ch-main">
                          <div className="ch-label">{cargo.titulo}</div>
                          <div className={`ch-person ${isVago ? 'vago' : ''}`}>
                            {cargo.pessoa ? cargo.pessoa : 'Vago'}
                          </div>

                          {cargo.pendente && (
                            <div className="ch-pend-banner">
                              <span>
                                Em processo: <b>{cargo.pendente.pessoa}</b> ({cargo.pendente.etapa || 'proposta'})
                              </span>
                              {canWrite && (
                                <button
                                  type="button"
                                  className="btn-concluir-apoio"
                                  onClick={() => onApplyPending(suborg.id, cargo.id)}
                                >
                                  Concluir
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="ch-acts acts">
                          {canWrite && !cargo.fixo && (
                            <>
                              {isVago && !cargo.pendente && (
                                <button
                                  type="button"
                                  className="btn sm btn-indicar"
                                  onClick={() => onOpenSwapModal(suborg, cargo, 'processo')}
                                  title="Iniciar processo de indicação de chamado"
                                >
                                  Indicar
                                </button>
                              )}
                              <button
                                type="button"
                                className={`btn sm ${isVago ? 'btn-preencher' : 'btn-trocar'}`}
                                onClick={() => onOpenSwapModal(suborg, cargo, 'agora')}
                              >
                                {isVago ? 'Preencher' : 'Trocar'}
                              </button>
                              <button
                                type="button"
                                className="btn-del-cargo"
                                onClick={() => onDeleteCargo(suborg.id, cargo.id, cargo.titulo)}
                                title="Excluir chamado"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {canWrite && (
                  <button
                    type="button"
                    className="btn-add-chamado"
                    onClick={() => onOpenAddCargoModal(suborg)}
                  >
                    + Chamado
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
