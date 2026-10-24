import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Membro, MembroMeta, Organizacao, MembroProfile360 } from '../../types';
import { ageGroup, norm } from './membrosUtils';
import { MembrosStatsCards } from './MembrosStatsCards';
import { MembrosFilterBar, CategoryFilter, GenderFilter } from './MembrosFilterBar';
import { MembrosList, ActiveCalling } from './MembrosList';
import { MembroDrawer360 } from './MembroDrawer360';
import { MembroFormModal, MembroFormData } from './MembroFormModal';
import { MembrosImportModal } from './MembrosImportModal';

export const Membros: React.FC = () => {
  const { isBishopric, canWrite } = useAuth();
  const [members, setMembers] = useState<Membro[]>([]);
  const [suborgs, setSuborgs] = useState<Organizacao[]>([]);
  const [meta, setMeta] = useState<MembroMeta | null>(null);
  const [loading, setLoading] = useState(true);

  // Drawer 360 states
  const [drawerMember, setDrawerMember] = useState<Membro | null>(null);
  const [profile360, setProfile360] = useState<MembroProfile360 | null>(null);
  const [loading360, setLoading360] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('todos');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('todos');
  const [limit, setLimit] = useState(60);

  // Single Member Form Modal
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Membro | null>(null);

  // Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [isBishopric]);

  async function loadMembers() {
    try {
      const [membersRes, orgsRes] = await Promise.all([
        api.get<{ members: Membro[]; meta: MembroMeta }>('/membros'),
        api.get<Organizacao[]>('/chamados/organizacoes').catch(() => []),
      ]);
      setMembers(membersRes.members || []);
      setMeta(membersRes.meta || null);
      setSuborgs(orgsRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openNewMemberModal() {
    setEditingMember(null);
    setIsMemberModalOpen(true);
  }

  function openEditMemberModal(m: Membro) {
    setEditingMember(m);
    setIsMemberModalOpen(true);
  }

  async function handleMemberSubmit(formData: MembroFormData) {
    try {
      if (editingMember) {
        await api.put(`/membros/${editingMember.id}`, formData);
      } else {
        await api.post('/membros', formData);
      }

      setIsMemberModalOpen(false);
      loadMembers();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar membro');
    }
  }

  async function handleMemberDelete(id: string) {
    if (!confirm('Deseja excluir este membro da lista?')) return;
    try {
      await api.delete(`/membros/${id}`);
      setIsMemberModalOpen(false);
      loadMembers();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir membro');
    }
  }

  async function handleImportSubmit(parsedRecords: any[], removeUnlisted: boolean) {
    setImporting(true);
    try {
      const res = await api.post<{ total: number }>('/membros/import', {
        records: parsedRecords,
        removeUnlisted,
      });

      alert(`Importação concluída com sucesso! ${res.total} membros na lista.`);
      setIsImportModalOpen(false);
      loadMembers();
    } catch (err: any) {
      alert(err.message || 'Erro na importação de membros');
    } finally {
      setImporting(false);
    }
  }

  // Active callings map across ward organizations
  const activeCallingsMap = useMemo(() => {
    const map: Record<string, ActiveCalling[]> = {};
    suborgs.forEach(org => {
      (org.cargos || []).forEach(c => {
        if (c.pessoa) {
          const k = norm(c.pessoa);
          if (!map[k]) map[k] = [];
          map[k].push({
            suborgId: org.id,
            suborgNome: org.nome,
            orgGrupo: org.grupo || 'Outros',
            cargoId: c.id,
            cargoTitulo: c.titulo,
            desde: c.desde,
          });
        }
      });
    });
    return map;
  }, [suborgs]);

  const getMemberActiveCallings = (m: Membro): ActiveCalling[] => {
    return activeCallingsMap[norm(m.nome)] || [];
  };

  const hasAnyCalling = (m: Membro) => {
    const active = getMemberActiveCallings(m);
    return active.length > 0 || Boolean(m.chamado && m.chamado.trim());
  };

  async function openDrawer(m: Membro) {
    setDrawerMember(m);
    setLoading360(true);
    setProfile360(null);
    try {
      const res = await api.get<MembroProfile360>(`/membros/${m.id}/profile360`);
      setProfile360(res);
    } catch (err) {
      console.error('Erro ao carregar perfil 360:', err);
    } finally {
      setLoading360(false);
    }
  }

  async function handleToggleTaskStatus(taskId: string, currentStatus: string, origem: 'bispado' | 'conselho') {
    try {
      const nextStatus = currentStatus === 'concluida' ? 'pendente' : 'concluida';
      await api.put(`/designacoes/${taskId}`, {
        status: nextStatus,
        currentOrigin: origem,
      });
      if (drawerMember) {
        const res = await api.get<MembroProfile360>(`/membros/${drawerMember.id}/profile360`);
        setProfile360(res);
      }
    } catch (err) {
      console.error('Erro ao atualizar status da tarefa:', err);
    }
  }

  async function handleAddQuickTask(titulo: string) {
    if (!drawerMember) return;
    try {
      await api.post('/designacoes', {
        titulo,
        responsavel: drawerMember.nome,
        origem: isBishopric ? 'bispado' : 'conselho',
        status: 'pendente',
      });
      const res = await api.get<MembroProfile360>(`/membros/${drawerMember.id}/profile360`);
      setProfile360(res);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar designação');
    }
  }

  if (!isBishopric) {
    return <div className="notice bisp">Acesso restrito aos membros do Bispado.</div>;
  }

  if (loading) {
    return <div className="empty">Carregando lista de membros…</div>;
  }

  const totalAdultos = members.filter(m => ageGroup(m) === 'adultos').length;
  const totalJovens = members.filter(m => ageGroup(m) === 'jovens').length;
  const totalCriancas = members.filter(m => ageGroup(m) === 'criancas').length;
  const semChamado = members.filter(m => ageGroup(m) === 'adultos' && !hasAnyCalling(m)).length;

  const q = search.toLowerCase().trim();
  const filtered = members.filter(m => {
    if (genderFilter !== 'todos' && m.sexo !== genderFilter) return false;
    if (categoryFilter === 'adultos' && ageGroup(m) !== 'adultos') return false;
    if (categoryFilter === 'jovens' && ageGroup(m) !== 'jovens') return false;
    if (categoryFilter === 'criancas' && ageGroup(m) !== 'criancas') return false;
    if (categoryFilter === 'semchamado' && (ageGroup(m) !== 'adultos' || hasAnyCalling(m))) return false;
    if (q) {
      const activeTitles = getMemberActiveCallings(m).map(c => `${c.cargoTitulo} ${c.suborgNome}`).join(' ');
      const txt = `${m.nome} ${m.chamado || ''} ${activeTitles} ${m.telefone || ''}`.toLowerCase();
      if (!txt.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h2>Membros</h2>
          <p className="sub">
            Lista da ala para acompanhamento e indicação de chamados. Somente o bispado vê esta página.
          </p>
        </div>
        {canWrite && (
          <div className="btns">
            <button type="button" className="btn bisp" onClick={() => setIsImportModalOpen(true)}>
              Importar lista
            </button>
            <button type="button" className="btn" onClick={openNewMemberModal}>
              + Membro
            </button>
          </div>
        )}
      </div>

      <MembrosStatsCards
        totalMembers={members.length}
        metaTotal={meta?.total}
        totalAdultos={totalAdultos}
        totalJovens={totalJovens}
        totalCriancas={totalCriancas}
        semChamado={semChamado}
      />

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MembrosFilterBar
          search={search}
          setSearch={setSearch}
          genderFilter={genderFilter}
          setGenderFilter={setGenderFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          totalMembers={members.length}
          totalAdultos={totalAdultos}
          totalJovens={totalJovens}
          totalCriancas={totalCriancas}
          semChamado={semChamado}
        />

        <MembrosList
          filtered={filtered}
          limit={limit}
          setLimit={setLimit}
          canWrite={canWrite}
          getMemberActiveCallings={getMemberActiveCallings}
          onOpenDrawer={openDrawer}
          onEditMember={openEditMemberModal}
        />
      </section>

      {/* Drawer: Ficha 360° do Membro */}
      <MembroDrawer360
        drawerMember={drawerMember}
        onClose={() => setDrawerMember(null)}
        profile360={profile360}
        loading360={loading360}
        canWrite={canWrite}
        onEditMember={openEditMemberModal}
        onToggleTaskStatus={handleToggleTaskStatus}
        onAddQuickTask={handleAddQuickTask}
      />

      {/* Modal: Adicionar / Editar Membro */}
      <MembroFormModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        editingMember={editingMember}
        onSubmit={handleMemberSubmit}
        onDelete={handleMemberDelete}
      />

      {/* Modal: Importar Lista */}
      <MembrosImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportSubmit}
        importing={importing}
      />
    </div>
  );
};
