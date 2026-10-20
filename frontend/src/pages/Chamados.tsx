import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Organizacao, Cargo, Membro } from '../types';

export const Chamados: React.FC = () => {
  const { isBishopric, canWrite } = useAuth();
  const [orgs, setOrgs] = useState<Organizacao[]>([]);
  const [members, setMembers] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'todos' | 'vagos' | 'troca'>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [activeOrg, setActiveOrg] = useState<Organizacao | null>(null);
  const [activeCargo, setActiveCargo] = useState<Cargo | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isAddCargoModalOpen, setIsAddCargoModalOpen] = useState(false);
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);

  // Swap form states
  const [swapNome, setSwapNome] = useState('');
  const [swapFilterText, setSwapFilterText] = useState('');
  const [swapModo, setSwapModo] = useState<'agora' | 'processo'>('agora');
  const [swapData, setSwapData] = useState(new Date().toISOString().split('T')[0]);
  const [swapTitulo, setSwapTitulo] = useState('');
  const [desobrigarAtual, setDesobrigarAtual] = useState(true);

  // Add cargo states
  const [newCargoTitulo, setNewCargoTitulo] = useState('');
  const [newCargoPessoa, setNewCargoPessoa] = useState('');
  const [newCargoFilterText, setNewCargoFilterText] = useState('');

  // Add org states
  const [newOrgNome, setNewOrgNome] = useState('');
  const [newOrgGrupo, setNewOrgGrupo] = useState('Organizações da ala');

  // Load data
  useEffect(() => {
    loadOrgs();
    loadMembers();
  }, [isBishopric]);

  // All useMemo hooks placed at the top level
  const memberCallingsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    orgs.forEach(org => {
      org.cargos.forEach(c => {
        if (c.pessoa) {
          const k = c.pessoa.toLowerCase().trim();
          if (!map[k]) map[k] = [];
          map[k].push(`${c.titulo} (${org.nome})`);
        }
      });
    });
    return map;
  }, [orgs]);

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

  const allCargos = useMemo(() => orgs.flatMap(g => g.cargos.map(c => ({ g, c }))), [orgs]);
  const totalCargos = useMemo(() => allCargos.filter(x => !x.c.fixo).length, [allCargos]);
  const preenchidos = useMemo(() => allCargos.filter(x => !x.c.fixo && x.c.pessoa).length, [allCargos]);
  const vagos = useMemo(() => totalCargos - preenchidos, [totalCargos, preenchidos]);
  const trocas = useMemo(() => allCargos.filter(x => x.c.pendente).length, [allCargos]);

  async function loadOrgs() {
    try {
      const data = await api.get<Organizacao[]>('/chamados/organizacoes');
      setOrgs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  function openSwapModal(org: Organizacao, cargo: Cargo) {
    setActiveOrg(org);
    setActiveCargo(cargo);
    setSwapNome(cargo.pessoa || '');
    setSwapFilterText('');
    setSwapModo('agora');
    setSwapData(new Date().toISOString().split('T')[0]);
    setSwapTitulo(cargo.titulo);
    setDesobrigarAtual(Boolean(cargo.pessoa));
    setIsSwapModalOpen(true);
  }

  function openAddCargoModal(org: Organizacao) {
    setActiveOrg(org);
    setNewCargoTitulo('');
    setNewCargoPessoa('');
    setNewCargoFilterText('');
    setIsAddCargoModalOpen(true);
  }

  async function handleSwapSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrg || !activeCargo) return;

    // If "(Nenhum)" is selected (empty string)
    if (!swapNome.trim()) {
      if (activeCargo.pessoa) {
        try {
          await api.post(`/chamados/organizacoes/${activeOrg.id}/cargos/${activeCargo.id}/vagar`, {
            data: swapData,
          });
          setIsSwapModalOpen(false);
          loadOrgs();
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
      await api.post(`/chamados/organizacoes/${activeOrg.id}/cargos/${activeCargo.id}/swap`, {
        nome: swapNome,
        modo: swapModo,
        data: swapData,
        titulo: swapTitulo,
        desobrigarAtual,
      });
      setIsSwapModalOpen(false);
      loadOrgs();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar chamado');
    }
  }

  async function handleVagar() {
    if (!activeOrg || !activeCargo) return;
    if (!confirm('Deseja deixar este chamado vago?')) return;

    try {
      await api.post(`/chamados/organizacoes/${activeOrg.id}/cargos/${activeCargo.id}/vagar`, {
        data: swapData,
      });
      setIsSwapModalOpen(false);
      loadOrgs();
    } catch (err: any) {
      alert(err.message || 'Erro ao deixar vago');
    }
  }

  async function handleApplyPending(orgId: string, cargoId: string) {
    if (!confirm('Concluir a transição e registrar a nova pessoa neste chamado?')) return;
    try {
      await api.post(`/chamados/organizacoes/${orgId}/cargos/${cargoId}/apply-pending`);
      loadOrgs();
    } catch (err: any) {
      alert(err.message || 'Erro ao concluir troca');
    }
  }

  async function handleAddCargo(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrg || !newCargoTitulo.trim()) return;

    try {
      await api.post(`/chamados/organizacoes/${activeOrg.id}/cargos`, {
        titulo: newCargoTitulo.trim(),
        pessoa: newCargoPessoa.trim(),
        desde: newCargoPessoa ? new Date().toISOString().split('T')[0] : '',
      });
      setIsAddCargoModalOpen(false);
      setNewCargoTitulo('');
      setNewCargoPessoa('');
      loadOrgs();
    } catch (err: any) {
      alert(err.message || 'Erro ao adicionar chamado');
    }
  }

  async function handleAddOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!newOrgNome.trim()) return;

    try {
      await api.post('/chamados/organizacoes', {
        nome: newOrgNome.trim(),
        grupo: newOrgGrupo,
        ordem: orgs.length + 1,
        cargos: [],
      });
      setIsAddOrgModalOpen(false);
      setNewOrgNome('');
      loadOrgs();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar organização');
    }
  }

  const q = searchQuery.toLowerCase().trim();
  const matchFilter = (c: Cargo, g: Organizacao) => {
    if (filterType === 'vagos' && (c.pessoa || c.fixo)) return false;
    if (filterType === 'troca' && !c.pendente) return false;
    if (q) {
      const txt = `${c.titulo} ${c.pessoa || ''} ${g.nome} ${c.pendente?.pessoa || ''}`.toLowerCase();
      if (!txt.includes(q)) return false;
    }
    return true;
  };

  // Conditional early returns placed safely AFTER all hooks
  if (!isBishopric) {
    return <div className="notice bisp">Acesso restrito aos membros do Bispado.</div>;
  }

  if (loading) {
    return <div className="empty">Carregando lista de chamados…</div>;
  }

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h2>Lista de Chamados</h2>
          <p className="sub">
            Quem serve em cada chamado da ala. Toque em “Trocar” para substituir alguém ou em “Preencher” para um chamado vago.
          </p>
        </div>
        {canWrite && (
          <button type="button" className="btn ghost" onClick={() => setIsAddOrgModalOpen(true)}>
            + Organização
          </button>
        )}
      </div>

      <div className="stats">
        <div className="stat">
          <div className="v num">{totalCargos}</div>
          <div className="l">chamados na lista</div>
          <div className="x">{orgs.length} organizações</div>
        </div>

        <div className="stat">
          <div className="v num" style={{ color: 'var(--cons)' }}>{preenchidos}</div>
          <div className="l">preenchidos</div>
          <div className="x">{totalCargos ? Math.round((preenchidos / totalCargos) * 100) : 0}% da lista</div>
        </div>

        <div className="stat">
          <div className="v num" style={{ color: 'var(--crit)' }}>{vagos}</div>
          <div className="l">vagos</div>
          <div className="x">possíveis indicações</div>
        </div>

        <div className="stat">
          <div className="v num" style={{ color: 'var(--warn)' }}>{trocas}</div>
          <div className="l">trocas em andamento</div>
        </div>
      </div>

      <div className="searchbar">
        <input
          className="inp"
          type="search"
          placeholder="Buscar por nome, chamado ou organização"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <div className="chips">
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
              className={`chip ${filterType === val ? 'on' : ''}`}
              onClick={() => setFilterType(val)}
            >
              {label} <span className="c num">{n}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ch-grid">
        {orgs.map(org => {
          const matchingCargos = org.cargos.filter(c => matchFilter(c, org));
          if (!matchingCargos.length && (filterType !== 'todos' || searchQuery)) return null;

          const fill = org.cargos.filter(c => c.pessoa).length;

          return (
            <section key={org.id} className="card ch-org">
              <div className="ch-oh">
                <h3>{org.nome}</h3>
                <span className="row-m num">{fill} de {org.cargos.length}</span>
              </div>

              <div className="list">
                {matchingCargos.map(cargo => {
                  const isVago = !cargo.pessoa && !cargo.fixo;
                  return (
                    <div key={cargo.id} className={`ch-row ${isVago ? 'vago' : ''}`}>
                      <div className="ch-main">
                        <div className="ch-t">{cargo.titulo}</div>
                        <div className="ch-p">
                          {cargo.pessoa ? (
                            <span>{cargo.pessoa}</span>
                          ) : (
                            <span className="ch-vago-tag">Vago</span>
                          )}
                          {cargo.desde && <span className="ch-desde">desde {cargo.desde}</span>}
                        </div>

                        {cargo.pendente && (
                          <div className="ch-pend">
                            <span>
                              <b>Em processo:</b> {cargo.pendente.pessoa} ({cargo.pendente.etapa || 'proposta'})
                            </span>
                            {canWrite && (
                              <button
                                type="button"
                                className="btn sm ok"
                                onClick={() => handleApplyPending(org.id, cargo.id)}
                              >
                                Concluir apoio
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {canWrite && !cargo.fixo && (
                        <div className="acts">
                          <button
                            type="button"
                            className="btn sm"
                            onClick={() => openSwapModal(org, cargo)}
                          >
                            {!cargo.pessoa ? 'Preencher' : 'Trocar'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {canWrite && (
                <button
                  type="button"
                  className="btn ghost sm"
                  style={{ alignSelf: 'flex-start', marginTop: 8 }}
                  onClick={() => openAddCargoModal(org)}
                >
                  + Chamado
                </button>
              )}
            </section>
          );
        })}
      </div>

      {/* Modal: Trocar / Preencher Chamado */}
      {isSwapModalOpen && activeCargo && activeOrg && (
        <div className="modal" onClick={() => setIsSwapModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>
              {!activeCargo.pessoa ? 'Preencher' : 'Trocar'}: {activeCargo.titulo}
            </h3>
            <p className="sub" style={{ marginTop: -8 }}>{activeOrg.nome}</p>

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

                {/* Filtro de busca rápida para a lista de membros */}
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

      {/* Modal: Adicionar Cargo */}
      {isAddCargoModalOpen && activeOrg && (
        <div className="modal" onClick={() => setIsAddCargoModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>Novo chamado · {activeOrg.nome}</h3>
            <form onSubmit={handleAddCargo} className="form">
              <div className="field">
                <label>Nome do chamado *</label>
                <input
                  className="inp"
                  value={newCargoTitulo}
                  onChange={e => setNewCargoTitulo(e.target.value)}
                  placeholder="Ex.: Professor de Doutrina do Evangelho"
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

                {/* Filtro de busca rápida para a lista de membros */}
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
                  <option value="">(Nenhum)</option>
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

                {newCargoPessoa && (
                  <div style={{ marginTop: 6, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>
                      Selecionado: <b>{newCargoPessoa}</b>
                    </span>
                    <button
                      type="button"
                      className="btn ghost sm"
                      style={{ padding: '2px 8px', fontSize: '11px' }}
                      onClick={() => setNewCargoPessoa('')}
                    >
                      Limpar para (Nenhum)
                    </button>
                  </div>
                )}
              </div>

              <div className="foot">
                <div className="btns">
                  <button type="submit" className="btn pri">
                    Adicionar
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

      {/* Modal: Adicionar Organização */}
      {isAddOrgModalOpen && (
        <div className="modal" onClick={() => setIsAddOrgModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>Nova organização</h3>
            <form onSubmit={handleAddOrg} className="form">
              <div className="field">
                <label>Nome da organização *</label>
                <input
                  className="inp"
                  value={newOrgNome}
                  onChange={e => setNewOrgNome(e.target.value)}
                  placeholder="Ex.: Escola Dominical"
                  required
                />
              </div>

              <div className="field">
                <label>Grupo / Bloco</label>
                <select
                  className="inp"
                  value={newOrgGrupo}
                  onChange={e => setNewOrgGrupo(e.target.value)}
                >
                  <option value="Bispado e secretaria">Bispado e secretaria</option>
                  <option value="Quórum de Élderes e Sociedade de Socorro">Quórum de Élderes e Sociedade de Socorro</option>
                  <option value="Classes das Moças">Classes das Moças</option>
                  <option value="Organizações da ala">Organizações da ala</option>
                  <option value="Outros chamados">Outros chamados</option>
                </select>
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
