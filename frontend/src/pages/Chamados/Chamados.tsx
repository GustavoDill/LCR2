import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Organizacao, Cargo, Membro, OrganizacaoItem } from '../../types';
import { ChamadosStatsCards } from './ChamadosStatsCards';
import { ChamadosSearchBar, ChamadosFilterType } from './ChamadosSearchBar';
import { ChamadosOrgSection } from './ChamadosOrgSection';
import { ChamadosSwapModal } from './ChamadosSwapModal';
import { ChamadosAddCargoModal } from './ChamadosAddCargoModal';
import { ChamadosAddSubOrgModal } from './ChamadosAddSubOrgModal';
import { ChamadosAddOrgModal } from './ChamadosAddOrgModal';

export const Chamados: React.FC = () => {
  const { isBishopric, canWrite } = useAuth();
  const [suborgs, setSuborgs] = useState<Organizacao[]>([]);
  const [orgList, setOrgList] = useState<OrganizacaoItem[]>([]);
  const [members, setMembers] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<ChamadosFilterType>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [activeSubOrg, setActiveSubOrg] = useState<Organizacao | null>(null);
  const [activeCargo, setActiveCargo] = useState<Cargo | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapDefaultModo, setSwapDefaultModo] = useState<'agora' | 'processo'>('agora');
  const [isAddCargoModalOpen, setIsAddCargoModalOpen] = useState(false);
  const [isAddSubOrgModalOpen, setIsAddSubOrgModalOpen] = useState(false);
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
  const [selectedParentOrgForSubOrg, setSelectedParentOrgForSubOrg] = useState('');

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

  // Overall Statistics
  const allCargos = useMemo(() => suborgs.flatMap(g => (g.cargos || []).map(c => ({ g, c }))), [suborgs]);
  const totalCargos = useMemo(() => allCargos.filter(x => !x.c.fixo).length, [allCargos]);
  const preenchidos = useMemo(() => allCargos.filter(x => !x.c.fixo && x.c.pessoa).length, [allCargos]);
  const vagos = useMemo(() => totalCargos - preenchidos, [totalCargos, preenchidos]);
  const trocas = useMemo(() => allCargos.filter(x => x.c.pendente).length, [allCargos]);

  // Grouped hierarchy: Level 1 (Organização) -> Level 2 (Suborganização) -> Level 3 (Chamados)
  const groupedHierarchy = useMemo(() => {
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

  // Modal Triggers
  function openSwapModal(suborg: Organizacao, cargo: Cargo, defaultModo: 'agora' | 'processo' = 'agora') {
    setActiveSubOrg(suborg);
    setActiveCargo(cargo);
    setSwapDefaultModo(defaultModo);
    setIsSwapModalOpen(true);
  }

  function openAddCargoModal(suborg: Organizacao) {
    setActiveSubOrg(suborg);
    setIsAddCargoModalOpen(true);
  }

  function openAddSubOrgModal(parentOrgNome?: string) {
    const initialParent = parentOrgNome || (orgList[0]?.nome || 'Bispado e Secretaria');
    setSelectedParentOrgForSubOrg(initialParent);
    setIsAddSubOrgModalOpen(true);
  }

  function openAddOrgModal() {
    setIsAddOrgModalOpen(true);
  }

  // Submit Handlers
  async function handleSwapSubmit(data: {
    nome: string;
    modo: 'agora' | 'processo';
    data: string;
    titulo: string;
    desobrigarAtual: boolean;
  }) {
    if (!activeSubOrg || !activeCargo) return;

    if (!data.nome.trim()) {
      if (activeCargo.pessoa) {
        try {
          await api.post(`/chamados/organizacoes/${activeSubOrg.id}/cargos/${activeCargo.id}/vagar`, {
            data: data.data,
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
        nome: data.nome,
        modo: data.modo,
        data: data.data,
        titulo: data.titulo,
        desobrigarAtual: data.desobrigarAtual,
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
        data: new Date().toISOString().split('T')[0],
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
  async function handleAddOrg(nome: string) {
    try {
      await api.post('/chamados/organizacoes-lista', {
        nome,
      });
      setIsAddOrgModalOpen(false);
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
  async function handleAddSubOrg(nome: string, grupo: string) {
    try {
      await api.post('/chamados/organizacoes', {
        nome,
        grupo,
        ordem: suborgs.length + 1,
        cargos: [],
      });
      setIsAddSubOrgModalOpen(false);
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
  async function handleAddCargo(titulo: string, pessoa: string) {
    if (!activeSubOrg) return;

    try {
      await api.post(`/chamados/organizacoes/${activeSubOrg.id}/cargos`, {
        titulo,
        pessoa,
        desde: pessoa ? new Date().toISOString().split('T')[0] : '',
      });
      setIsAddCargoModalOpen(false);
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
      <ChamadosStatsCards
        totalCargos={totalCargos}
        suborgsCount={suborgs.length}
        preenchidos={preenchidos}
        vagos={vagos}
        trocas={trocas}
      />

      {/* Searchbar & Filter Pills */}
      <ChamadosSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        totalCargos={totalCargos}
        vagos={vagos}
        trocas={trocas}
      />

      {/* Hierarchical View: Organização -> Suborganização -> Chamados */}
      {groupedHierarchy.map(group => (
        <ChamadosOrgSection
          key={group.nome}
          group={group}
          searchQuery={searchQuery}
          filterType={filterType}
          canWrite={canWrite}
          onOpenAddSubOrgModal={openAddSubOrgModal}
          onDeleteOrg={handleDeleteOrg}
          onDeleteSubOrg={handleDeleteSubOrg}
          onOpenAddCargoModal={openAddCargoModal}
          onOpenSwapModal={openSwapModal}
          onDeleteCargo={handleDeleteCargo}
          onApplyPending={handleApplyPending}
        />
      ))}

      {/* Modal 1: Trocar / Preencher Chamado */}
      <ChamadosSwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        activeSubOrg={activeSubOrg}
        activeCargo={activeCargo}
        defaultModo={swapDefaultModo}
        members={members}
        memberCallingsMap={memberCallingsMap}
        onSubmit={handleSwapSubmit}
        onVagar={handleVagar}
        onDeleteCargo={handleDeleteCargo}
      />

      {/* Modal 2: Adicionar Chamado */}
      <ChamadosAddCargoModal
        isOpen={isAddCargoModalOpen}
        onClose={() => setIsAddCargoModalOpen(false)}
        activeSubOrg={activeSubOrg}
        members={members}
        memberCallingsMap={memberCallingsMap}
        onSubmit={handleAddCargo}
      />

      {/* Modal 3: Adicionar Suborganização (Nível 2) */}
      <ChamadosAddSubOrgModal
        isOpen={isAddSubOrgModalOpen}
        onClose={() => setIsAddSubOrgModalOpen(false)}
        orgList={orgList}
        suborgs={suborgs}
        initialParentOrgNome={selectedParentOrgForSubOrg}
        onSubmit={handleAddSubOrg}
      />

      {/* Modal 4: Adicionar Organização (Nível 1) */}
      <ChamadosAddOrgModal
        isOpen={isAddOrgModalOpen}
        onClose={() => setIsAddOrgModalOpen(false)}
        onSubmit={handleAddOrg}
      />
    </div>
  );
};
