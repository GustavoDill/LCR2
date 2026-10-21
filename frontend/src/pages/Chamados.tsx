import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Organizacao, Cargo, Membro, OrganizacaoItem } from '../types';

export const Chamados: React.FC = () => {
  const { isBishopric, canWrite } = useAuth();
  const [suborgs, setSuborgs] = useState<Organizacao[]>([]);
  const [orgList, setOrgList] = useState<OrganizacaoItem[]>([]);
  const [members, setMembers] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'todos' | 'vagos' | 'troca'>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [activeSubOrg, setActiveSubOrg] = useState<Organizacao | null>(null);
  const [activeCargo, setActiveCargo] = useState<Cargo | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isAddCargoModalOpen, setIsAddCargoModalOpen] = useState(false);
  const [isAddSubOrgModalOpen, setIsAddSubOrgModalOpen] = useState(false);
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
  const [selectedParentOrgForSubOrg, setSelectedParentOrgForSubOrg] = useState('');

  // Swap form state
  const [swapNome, setSwapNome] = useState('');
  const [swapFilterText, setSwapFilterText] = useState('');
  const [swapModo, setSwapModo] = useState<'agora' | 'processo'>('agora');
  const [swapData, setSwapData] = useState(new Date().toISOString().split('T')[0]);
  const [swapTitulo, setSwapTitulo] = useState('');
  const [desobrigarAtual, setDesobrigarAtual] = useState(true);

  // Add cargo form state
  const [newCargoTitulo, setNewCargoTitulo] = useState('');
  const [newCargoPessoa, setNewCargoPessoa] = useState('');
  const [newCargoFilterText, setNewCargoFilterText] = useState('');

  // Add suborg form state
  const [newSubOrgNome, setNewSubOrgNome] = useState('');
  const [newSubOrgGrupo, setNewSubOrgGrupo] = useState('');

  // Add parent org form state
  const [newOrgNome, setNewOrgNome] = useState('');

  // Load data
  useEffect(() => {
    loadAllData();
  }, [isBishopric]);

  async function loadAllData() {
    try {
      await Promise.all([loadOrgsList(), loadSubOrgs(), loadMembers()]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadOrgsList() {
    try {
      const data = await api.get<OrganizacaoItem[]>('/chamados/organizacoes-lista');
      setOrgList(data);
    } catch (err) {
      console.error('Erro ao carregar lista de organizações:', err);
    }
  }

  async function loadSubOrgs() {
    try {
      const data = await api.get<Organizacao[]>('/chamados/organizacoes');
      setSuborgs(data);
    } catch (err) {
      console.error('Erro ao carregar suborganizações:', err);
    }
  }

  async function loadMembers() {
    try {
      const res = await api.get<{ members: Membro[] }>('/membros');
      setMembers(res.members || []);
    } catch (err) {
      console.debug('Membros não puderam ser carregados:', err);
    }
  }

  // Member callings lookup
  const memberCallingsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    suborgs.forEach(org => {
      (org.cargos || []).forEach(c => {
        if (c.pessoa) {
          const k = c.pessoa.toLowerCase().trim();
          if (!map[k]) map[k] = [];
          map[k].push(`${c.titulo} (${org.nome})`);
        }
      });
    });
    return map;
  }, [suborgs]);

  const filteredMembersForSwap = useMemo(() => {
    const q = swapFilterText.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      m => m.nome.toLowerCase().includes(q) || (m.nomeOriginal && m.nomeOriginal.toLowerCase().includes(q))
    );
  }, [swapFilterText, members]);

  const filteredMembersForNewCargo = useMemo(() => {
    const q = newCargoFilterText.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      m => m.nome.toLowerCase().includes(q) || (m.nomeOriginal && m.nomeOriginal.toLowerCase().includes(q))
    );
  }, [newCargoFilterText, members]);

  // Overall Statistics
  const allCargos = useMemo(() => suborgs.flatMap(g => (g.cargos || []).map(c => ({ g, c }))), [suborgs]);
  const totalCargos = useMemo(() => allCargos.filter(x => !x.c.fixo).length, [allCargos]);
  const preenchidos = useMemo(() => allCargos.filter(x => !x.c.fixo && x.c.pessoa).length, [allCargos]);
  const vagos = useMemo(() => totalCargos - preenchidos, [totalCargos, preenchidos]);
  const trocas = useMemo(() => allCargos.filter(x => x.c.pendente).length, [allCargos]);

  // Grouped hierarchy: Level 1 (Organização) -> Level 2 (Suborganização) -> Level 3 (Chamados)
  const groupedHierarchy = useMemo(() => {
    // Collect all unique organization group names
    const orgNamesSet = new Set<string>();
    orgList.forEach(o => {
      if (o.nome?.trim()) orgNamesSet.add(o.nome.trim());
    });
    suborgs.forEach(s => {
      if (s.grupo?.trim()) orgNamesSet.add(s.grupo.trim());
    });

    const groups: { nome: string; suborgs: Organizacao[] }[] = [];
    orgNamesSet.forEach(orgNome => {
      const children = suborgs.filter(s => (s.grupo || 'Outros').trim().toLowerCase() === orgNome.toLowerCase());
      groups.push({
        nome: orgNome,
        suborgs: children,
      });
    });

    return groups;
  }, [orgList, suborgs]);

  // Filter check
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

  // Modal Triggers
  function openSwapModal(suborg: Organizacao, cargo: Cargo, defaultModo: 'agora' | 'processo' = 'agora') {
    setActiveSubOrg(suborg);
    setActiveCargo(cargo);
    setSwapNome(cargo.pessoa || '');
    setSwapFilterText('');
    setSwapModo(defaultModo);
    setSwapData(new Date().toISOString().split('T')[0]);
    setSwapTitulo(cargo.titulo);
    setDesobrigarAtual(Boolean(cargo.pessoa));
    setIsSwapModalOpen(true);
  }

  function openAddCargoModal(suborg: Organizacao) {
    setActiveSubOrg(suborg);
    setNewCargoTitulo('');
    setNewCargoPessoa('');
    setNewCargoFilterText('');
    setIsAddCargoModalOpen(true);
  }

  function openAddSubOrgModal(parentOrgNome?: string) {
    const initialParent = parentOrgNome || (orgList[0]?.nome || 'Bispado e Secretaria');
    setSelectedParentOrgForSubOrg(initialParent);
    setNewSubOrgGrupo(initialParent);
    setNewSubOrgNome('');
    setIsAddSubOrgModalOpen(true);
  }

  function openAddOrgModal() {
    setNewOrgNome('');
    setIsAddOrgModalOpen(true);
  }

  // Submit Handlers
  async function handleSwapSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSubOrg || !activeCargo) return;

    if (!swapNome.trim()) {
      if (activeCargo.pessoa) {
        try {
          await api.post(`/chamados/organizacoes/${activeSubOrg.id}/cargos/${activeCargo.id}/vagar`, {
            data: swapData,
          });
          setIsSwapModalOpen(false);
          loadSubOrgs();
        } catch (err: any) {
          alert(err.message || 'Erro ao deixar chamado vago');
        }
        return;
      } else {
        setIsSwapModalOpen(false);
        return;
      }
    }

    try {
      await api.post(`/chamados/organizacoes/${activeSubOrg.id}/cargos/${activeCargo.id}/swap`, {
        nome: swapNome,
        modo: swapModo,
        data: swapData,
        titulo: swapTitulo,
        desobrigarAtual,
      });
      setIsSwapModalOpen(false);
      loadSubOrgs();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar chamado');
    }
  }

  async function handleVagar() {
    if (!activeSubOrg || !activeCargo) return;
    if (!confirm('Deseja deixar este chamado vago?')) return;

    try {
      await api.post(`/chamados/organizacoes/${activeSubOrg.id}/cargos/${activeCargo.id}/vagar`, {
        data: swapData,
      });
      setIsSwapModalOpen(false);
      loadSubOrgs();
    } catch (err: any) {
      alert(err.message || 'Erro ao deixar vago');
    }
  }

  async function handleApplyPending(suborgId: string, cargoId: string) {
    if (!confirm('Concluir a transição e registrar a nova pessoa neste chamado?')) return;
    try {
      await api.post(`/chamados/organizacoes/${suborgId}/cargos/${cargoId}/apply-pending`);
      loadSubOrgs();
    } catch (err: any) {
      alert(err.message || 'Erro ao concluir troca');
    }
  }

  // Level 1: Add / Remove Organization
  async function handleAddOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!newOrgNome.trim()) return;

    try {
      await api.post('/chamados/organizacoes-lista', {
        nome: newOrgNome.trim(),
      });
      setIsAddOrgModalOpen(false);
      setNewOrgNome('');
      await loadOrgsList();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar organização');
    }
  }

  async function handleDeleteOrg(orgNome: string) {
    if (!confirm(`Deseja excluir a organização "${orgNome}" e todas as suas suborganizações e chamados?`)) {
      return;
    }

    try {
      await api.delete(`/chamados/organizacoes-lista/${encodeURIComponent(orgNome)}`);
      await Promise.all([loadOrgsList(), loadSubOrgs()]);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir organização');
    }
  }

  // Level 2: Add / Remove Suborganization
  async function handleAddSubOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubOrgNome.trim() || !newSubOrgGrupo.trim()) return;

    try {
      await api.post('/chamados/organizacoes', {
        nome: newSubOrgNome.trim(),
        grupo: newSubOrgGrupo.trim(),
        ordem: suborgs.length + 1,
        cargos: [],
      });
      setIsAddSubOrgModalOpen(false);
      setNewSubOrgNome('');
      await loadSubOrgs();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar suborganização');
    }
  }

  async function handleDeleteSubOrg(suborg: Organizacao) {
    if (!confirm(`Deseja excluir a suborganização "${suborg.nome}" e todos os seus chamados?`)) {
      return;
    }

    try {
      await api.delete(`/chamados/organizacoes/${suborg.id}`);
      await loadSubOrgs();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir suborganização');
    }
  }

  // Level 3: Add / Remove Chamado
  async function handleAddCargo(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSubOrg || !newCargoTitulo.trim()) return;

    try {
      await api.post(`/chamados/organizacoes/${activeSubOrg.id}/cargos`, {
        titulo: newCargoTitulo.trim(),
        pessoa: newCargoPessoa.trim(),
        desde: newCargoPessoa ? new Date().toISOString().split('T')[0] : '',
      });
      setIsAddCargoModalOpen(false);
      setNewCargoTitulo('');
      setNewCargoPessoa('');
      await loadSubOrgs();
    } catch (err: any) {
      alert(err.message || 'Erro ao adicionar chamado');
    }
  }

  async function handleDeleteCargo(suborgId: string, cargoId: string, cargoTitulo: string) {
    if (!confirm(`Deseja excluir o chamado "${cargoTitulo}"?`)) return;

    try {
      await api.delete(`/chamados/organizacoes/${suborgId}/cargos/${cargoId}`);
      if (isSwapModalOpen) setIsSwapModalOpen(false);
      await loadSubOrgs();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir chamado');
    }
  }

  // Contextual icon for suborganization
  function renderSubOrgIcon(name: string) {
    const n = name.toLowerCase();
    if (n.includes('bispado')) {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" />
          <path d="M12 22V12" />
          <path d="M12 12l8-5" />
          <path d="M12 12L4 7" />
        </svg>
      );
    }
    if (n.includes('secretaria') || n.includes('executivo')) {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <circle cx="9" cy="10" r="2" />
          <line x1="15" y1="8" x2="17" y2="8" />
          <line x1="15" y1="12" x2="17" y2="12" />
          <line x1="7" y1="16" x2="17" y2="16" />
        </svg>
      );
    }
    if (n.includes('socorro') || n.includes('moças') || n.includes('primária')) {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    }
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (!isBishopric) {
    return <div className="notice bisp">Acesso restrito aos membros do Bispado.</div>;
  }

  if (loading) {
    return <div className="empty">Carregando lista de chamados…</div>;
  }

  return (
    <div className="ch-container">
      {/* Header Bar */}
      <div className="ch-head">
        <div className="ch-head-left">
          <div className="ch-head-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <circle cx="9" cy="10" r="2" />
              <line x1="15" y1="8" x2="17" y2="8" />
              <line x1="15" y1="12" x2="17" y2="12" />
              <line x1="7" y1="16" x2="17" y2="16" />
            </svg>
          </div>
          <div className="ch-head-text">
            <h2>Lista de Chamados</h2>
            <p>
              Quem serve em cada chamado da ala. Toque em “Trocar” para substituir alguém ou em “Preencher” para um chamado vago.
            </p>
          </div>
        </div>

        {canWrite && (
          <button type="button" className="btn-add-org-top" onClick={openAddOrgModal}>
            + Organização
          </button>
        )}
      </div>

      {/* 4-card Stats Bar */}
      <div className="ch-stats stats">
        <div className="ch-stat-card stat">
          <div className="v num">{totalCargos}</div>
          <div className="l">chamados na lista</div>
          <div className="x">{suborgs.length} organizações</div>
        </div>

        <div className="ch-stat-card stat">
          <div className="v num" style={{ color: '#2dd4bf' }}>{preenchidos}</div>
          <div className="l">preenchidos</div>
          <div className="x">{totalCargos ? Math.round((preenchidos / totalCargos) * 100) : 0}% da lista</div>
        </div>

        <div className="ch-stat-card stat">
          <div className="v num" style={{ color: '#f87171' }}>{vagos}</div>
          <div className="l">vagos</div>
          <div className="x">possíveis indicações</div>
        </div>

        <div className="ch-stat-card stat">
          <div className="v num" style={{ color: '#fbbf24' }}>{trocas}</div>
          <div className="l">trocas em andamento</div>
          <div className="x">&nbsp;</div>
        </div>
      </div>

      {/* Searchbar & Filter Pills */}
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

      {/* Hierarchical View: Organização -> Suborganização -> Chamados */}
      {groupedHierarchy.map(group => {
        // Filter suborganizations and cargos
        const matchingSuborgs = group.suborgs
          .map(suborg => {
            const matchedCargos = (suborg.cargos || []).filter(c => matchFilter(c, suborg, group.nome));
            return { suborg, matchedCargos };
          })
          .filter(({ matchedCargos, suborg }) => {
            if (searchQuery || filterType !== 'todos') {
              return matchedCargos.length > 0;
            }
            return true;
          });

        if (matchingSuborgs.length === 0 && (searchQuery || filterType !== 'todos')) {
          return null;
        }

        return (
          <section key={group.nome} className="ch-org-section">
            {/* Level 1: Organization Header */}
            <div className="ch-gh">
              <h3 className="ch-gh-title">{group.nome}</h3>
              {canWrite && (
                <div className="ch-gh-actions">
                  <button
                    type="button"
                    className="btn-add-suborg"
                    onClick={() => openAddSubOrgModal(group.nome)}
                    title={`Adicionar suborganização em ${group.nome}`}
                  >
                    + Suborganização
                  </button>
                  <button
                    type="button"
                    className="btn-del-org"
                    onClick={() => handleDeleteOrg(group.nome)}
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
                              onClick={() => handleDeleteSubOrg(suborg)}
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
                                        onClick={() => handleApplyPending(suborg.id, cargo.id)}
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
                                        onClick={() => openSwapModal(suborg, cargo, 'processo')}
                                        title="Iniciar processo de indicação de chamado"
                                      >
                                        Indicar
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className={`btn sm ${isVago ? 'btn-preencher' : 'btn-trocar'}`}
                                      onClick={() => openSwapModal(suborg, cargo, 'agora')}
                                    >
                                      {isVago ? 'Preencher' : 'Trocar'}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-del-cargo"
                                      onClick={() => handleDeleteCargo(suborg.id, cargo.id, cargo.titulo)}
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
                          onClick={() => openAddCargoModal(suborg)}
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
      })}

      {/* Modal 1: Trocar / Preencher Chamado */}
      {isSwapModalOpen && activeCargo && activeSubOrg && (
        <div className="modal" onClick={() => setIsSwapModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>
              {swapModo === 'processo'
                ? `Indicar pessoa: ${activeCargo.titulo}`
                : (!activeCargo.pessoa ? 'Preencher' : 'Trocar') + `: ${activeCargo.titulo}`}
            </h3>
            <p className="sub" style={{ marginTop: -8 }}>{activeSubOrg.nome}</p>

            <form onSubmit={handleSwapSubmit} className="form">
              <div className="field">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{!activeCargo.pessoa ? 'Quem vai servir' : 'Nova pessoa'}</span>
                  {members.length > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      {members.length} membros na ala
                    </span>
                  )}
                </label>

                <input
                  className="inp"
                  type="search"
                  placeholder="🔍 Digite para filtrar a lista abaixo..."
                  value={swapFilterText}
                  onChange={e => setSwapFilterText(e.target.value)}
                  style={{ marginBottom: 6, fontSize: '12.5px', padding: '6px 10px' }}
                />

                <select
                  className="inp"
                  value={swapNome}
                  onChange={e => setSwapNome(e.target.value)}
                  style={{ fontSize: '13.5px' }}
                >
                  <option value="">(Nenhum)</option>
                  {filteredMembersForSwap.map(m => {
                    const callings = memberCallingsMap[m.nome.toLowerCase().trim()];
                    const extra = callings && callings.length > 0 ? ` [⚠️ Já serve: ${callings[0]}]` : '';
                    const metaParts = [
                      m.idade ? `${m.idade} anos` : '',
                      m.sexo ? (m.sexo === 'M' ? 'M' : 'F') : '',
                    ].filter(Boolean).join(', ');
                    return (
                      <option key={m.id} value={m.nome}>
                        {m.nome} {metaParts ? `(${metaParts})` : ''}{extra}
                      </option>
                    );
                  })}
                </select>

                {swapNome && (
                  <div style={{ marginTop: 6, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>
                      Selecionado: <b>{swapNome}</b>
                    </span>
                    <button
                      type="button"
                      className="btn ghost sm"
                      style={{ padding: '2px 8px', fontSize: '11px' }}
                      onClick={() => setSwapNome('')}
                    >
                      Limpar para (Nenhum)
                    </button>
                  </div>
                )}

                {swapNome && memberCallingsMap[swapNome.toLowerCase().trim()] && (
                  <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: '6px', background: 'rgba(217, 119, 6, 0.1)', border: '1px solid #d97706', fontSize: '12px', color: 'var(--ink)' }}>
                    <strong style={{ color: '#d97706' }}>Aviso:</strong> {swapNome} já possui chamado(s): {memberCallingsMap[swapNome.toLowerCase().trim()].join(', ')}.
                  </div>
                )}
              </div>

              <div className="radios" role="radiogroup">
                <label>
                  <input
                    type="radio"
                    name="swapModo"
                    value="agora"
                    checked={swapModo === 'agora'}
                    onChange={() => setSwapModo('agora')}
                  />
                  <span>
                    <b>Já foi apoiado</b>
                    <small style={{ display: 'block', color: 'var(--muted)' }}>
                      Registra a pessoa no chamado imediatamente.
                    </small>
                  </span>
                </label>

                <label>
                  <input
                    type="radio"
                    name="swapModo"
                    value="processo"
                    checked={swapModo === 'processo'}
                    onChange={() => setSwapModo('processo')}
                  />
                  <span>
                    <b>Iniciar o processo de chamado</b>
                    <small style={{ display: 'block', color: 'var(--muted)' }}>
                      Entra no fluxo de indicação, entrevista, apoio e designação.
                    </small>
                  </span>
                </label>
              </div>

              <div className="field" style={{ maxWidth: 200 }}>
                <label>A partir de</label>
                <input
                  className="inp"
                  type="date"
                  value={swapData}
                  onChange={e => setSwapData(e.target.value)}
                />
              </div>

              {activeCargo.pessoa && swapModo === 'processo' && (
                <label className="chk">
                  <input
                    type="checkbox"
                    checked={desobrigarAtual}
                    onChange={e => setDesobrigarAtual(e.target.checked)}
                  />
                  Criar lembrete para desobrigar {activeCargo.pessoa}
                </label>
              )}

              {activeCargo.historico && activeCargo.historico.length > 0 && (
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                  <span className="lbl">Histórico de ocupantes anteriores</span>
                  <div className="list" style={{ marginTop: 6 }}>
                    {activeCargo.historico.map((h, i) => (
                      <div key={i} className="row" style={{ padding: '4px 0' }}>
                        <span style={{ fontWeight: 600 }}>{h.pessoa}</span>
                        <span className="row-m">
                          {h.desde ? `${h.desde} – ` : ''}
                          {h.ate || 'atual'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="foot">
                <div className="btns">
                  <button type="submit" className="btn pri">
                    Salvar
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setIsSwapModalOpen(false)}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn ghost danger"
                    onClick={() => handleDeleteCargo(activeSubOrg.id, activeCargo.id, activeCargo.titulo)}
                  >
                    Excluir chamado
                  </button>
                </div>
                {activeCargo.pessoa && (
                  <button type="button" className="btn ghost danger" onClick={handleVagar}>
                    Deixar vago
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Adicionar Chamado */}
      {isAddCargoModalOpen && activeSubOrg && (
        <div className="modal" onClick={() => setIsAddCargoModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>Novo chamado · {activeSubOrg.nome}</h3>
            <form onSubmit={handleAddCargo} className="form">
              <div className="field">
                <label>Nome do chamado *</label>
                <input
                  className="inp"
                  value={newCargoTitulo}
                  onChange={e => setNewCargoTitulo(e.target.value)}
                  placeholder="Ex.: 1º Conselheiro, Secretário Assistente"
                  required
                />
              </div>

              <div className="field">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Quem serve</span>
                  {members.length > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      {members.length} membros na ala
                    </span>
                  )}
                </label>

                <input
                  className="inp"
                  type="search"
                  placeholder="🔍 Digite para filtrar a lista abaixo..."
                  value={newCargoFilterText}
                  onChange={e => setNewCargoFilterText(e.target.value)}
                  style={{ marginBottom: 6, fontSize: '12.5px', padding: '6px 10px' }}
                />

                <select
                  className="inp"
                  value={newCargoPessoa}
                  onChange={e => setNewCargoPessoa(e.target.value)}
                  style={{ fontSize: '13.5px' }}
                >
                  <option value="">(Nenhum / Chamado Vago)</option>
                  {filteredMembersForNewCargo.map(m => {
                    const callings = memberCallingsMap[m.nome.toLowerCase().trim()];
                    const extra = callings && callings.length > 0 ? ` [⚠️ Já serve: ${callings[0]}]` : '';
                    const metaParts = [
                      m.idade ? `${m.idade} anos` : '',
                      m.sexo ? (m.sexo === 'M' ? 'M' : 'F') : '',
                    ].filter(Boolean).join(', ');
                    return (
                      <option key={m.id} value={m.nome}>
                        {m.nome} {metaParts ? `(${metaParts})` : ''}{extra}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="foot">
                <div className="btns">
                  <button type="submit" className="btn pri">
                    Adicionar chamado
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setIsAddCargoModalOpen(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Adicionar Suborganização (Nível 2) */}
      {isAddSubOrgModalOpen && (
        <div className="modal" onClick={() => setIsAddSubOrgModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>Nova suborganização</h3>
            <p className="sub" style={{ marginTop: -8 }}>
              Pertence à organização: <b>{newSubOrgGrupo}</b>
            </p>

            <form onSubmit={handleAddSubOrg} className="form">
              <div className="field">
                <label>Organização Pai (Nível 1)</label>
                <select
                  className="inp"
                  value={newSubOrgGrupo}
                  onChange={e => setNewSubOrgGrupo(e.target.value)}
                  required
                >
                  {orgList.map(o => (
                    <option key={o.id} value={o.nome}>
                      {o.nome}
                    </option>
                  ))}
                  {/* Also ensure any other group in suborgs is selectable */}
                  {Array.from(new Set(suborgs.map(s => s.grupo || 'Outros')))
                    .filter(g => !orgList.some(o => o.nome === g))
                    .map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                </select>
              </div>

              <div className="field">
                <label>Nome da suborganização *</label>
                <input
                  className="inp"
                  value={newSubOrgNome}
                  onChange={e => setNewSubOrgNome(e.target.value)}
                  placeholder="Ex.: Bispado, Secretaria da Ala, Quórum de Élderes"
                  required
                />
              </div>

              <div className="foot">
                <div className="btns">
                  <button type="submit" className="btn pri">
                    Criar suborganização
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setIsAddSubOrgModalOpen(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Adicionar Organização (Nível 1) */}
      {isAddOrgModalOpen && (
        <div className="modal" onClick={() => setIsAddOrgModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>Nova organização</h3>
            <p className="sub" style={{ marginTop: -8 }}>
              Crie uma organização principal (ex.: Bispado e Secretaria, Quórum de Élderes e Sociedade de Socorro, Classes das Moças).
            </p>

            <form onSubmit={handleAddOrg} className="form">
              <div className="field">
                <label>Nome da organização *</label>
                <input
                  className="inp"
                  value={newOrgNome}
                  onChange={e => setNewOrgNome(e.target.value)}
                  placeholder="Ex.: Bispado e Secretaria, Escola Dominical"
                  required
                />
              </div>

              <div className="foot">
                <div className="btns">
                  <button type="submit" className="btn pri">
                    Criar organização
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setIsAddOrgModalOpen(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
