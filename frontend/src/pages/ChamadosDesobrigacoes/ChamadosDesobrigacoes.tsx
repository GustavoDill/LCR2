import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Pessoa, Organizacao, Cargo, Membro } from '../../types';
import {
  ChamadosDesobrigacoesView,
  ModalTipo,
  VacantCargoItem,
  OccupiedCargoItem,
  ChamadoFormData,
} from './chamadosDesobrigacoesConstants';
import { ChamadosDesobrigacoesStatsCards } from './ChamadosDesobrigacoesStatsCards';
import { ChamadosDesobrigacoesViewTabs } from './ChamadosDesobrigacoesViewTabs';
import { ChamadosDesobrigacoesPipelineList } from './ChamadosDesobrigacoesPipelineList';
import { ChamadosDesobrigacoesVagosList } from './ChamadosDesobrigacoesVagosList';
import { ChamadosDesobrigacoesDesobList } from './ChamadosDesobrigacoesDesobList';
import { ChamadosDesobrigacoesConcluidosList } from './ChamadosDesobrigacoesConcluidosList';
import { ChamadosDesobrigacoesModal } from './ChamadosDesobrigacoesModal';

export const ChamadosDesobrigacoes: React.FC = () => {
  const { isBishopric, canWrite } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [suborgs, setSuborgs] = useState<Organizacao[]>([]);
  const [members, setMembers] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ChamadosDesobrigacoesView>('novos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<ModalTipo>('chamado');
  const [modalInitialData, setModalInitialData] = useState<{
    nome?: string;
    chamado?: string;
    selectedCargoRef?: { org: string; cargo: string } | null;
    proxima?: string;
    responsavel?: string;
    prazo?: string;
    obs?: string;
  }>({});

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadAllData().then(() => {
      const openIndicar = searchParams.get('openIndicar');
      const openDesob = searchParams.get('openDesobrigar');
      const pessoaNome = searchParams.get('pessoaNome') || '';
      const cargoParam = searchParams.get('cargo') || '';
      const orgId = searchParams.get('orgId') || '';
      const cargoId = searchParams.get('cargoId') || '';

      if (openIndicar === 'true') {
        setModalTipo('chamado');
        setModalInitialData({
          nome: pessoaNome,
          chamado: cargoParam,
          selectedCargoRef: orgId && cargoId ? { org: orgId, cargo: cargoId } : null,
          proxima: 'Entrevista com o bispado',
        });
        setIsModalOpen(true);
        setSearchParams({}, { replace: true });
      } else if (openDesob === 'true') {
        setModalTipo('desob');
        setModalInitialData({
          nome: pessoaNome,
          chamado: cargoParam,
          selectedCargoRef: orgId && cargoId ? { org: orgId, cargo: cargoId } : null,
          proxima: 'Conversar com a pessoa',
        });
        setIsModalOpen(true);
        setSearchParams({}, { replace: true });
      }
    });
  }, [isBishopric]);

  async function loadAllData() {
    try {
      await Promise.all([loadPessoas(), loadSubOrgs(), loadMembers()]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPessoas() {
    try {
      const data = await api.get<Pessoa[]>('/pessoas?tipo=chamado');
      setPessoas(data);
    } catch (err) {
      console.error('Erro ao carregar pessoas:', err);
    }
  }

  async function loadSubOrgs() {
    try {
      const data = await api.get<Organizacao[]>('/chamados/organizacoes');
      setSuborgs(data);
    } catch (err) {
      console.error('Erro ao carregar chamados:', err);
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

  // Lookup map of members already serving
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

  // List of vacant callings across the ward
  const vagasList = useMemo(() => {
    const list: VacantCargoItem[] = [];

    suborgs.forEach(org => {
      (org.cargos || []).forEach(c => {
        if (!c.pessoa && !c.fixo) {
          list.push({
            orgId: org.id,
            orgNome: org.nome,
            orgGrupo: org.grupo || 'Outros',
            cargo: c,
          });
        }
      });
    });

    return list;
  }, [suborgs]);

  // List of occupied callings (for release flow)
  const occupiedCallingsList = useMemo(() => {
    const list: OccupiedCargoItem[] = [];

    suborgs.forEach(org => {
      (org.cargos || []).forEach(c => {
        if (c.pessoa) {
          list.push({
            orgId: org.id,
            orgNome: org.nome,
            cargo: c,
          });
        }
      });
    });

    return list;
  }, [suborgs]);

  function openModal(type: ModalTipo, presetCargo?: { orgId: string; orgNome: string; cargo: Cargo }) {
    setModalTipo(type);

    if (presetCargo) {
      if (type === 'chamado') {
        setModalInitialData({
          nome: '',
          chamado: `${presetCargo.cargo.titulo} (${presetCargo.orgNome})`,
          selectedCargoRef: { org: presetCargo.orgId, cargo: presetCargo.cargo.id },
          proxima: 'Entrevista com o bispado',
          responsavel: 'Bispo',
          prazo: '',
          obs: '',
        });
      } else {
        setModalInitialData({
          nome: presetCargo.cargo.pessoa || '',
          chamado: `${presetCargo.cargo.titulo} (${presetCargo.orgNome})`,
          selectedCargoRef: { org: presetCargo.orgId, cargo: presetCargo.cargo.id },
          proxima: 'Conversar com a pessoa',
          responsavel: 'Bispo',
          prazo: '',
          obs: '',
        });
      }
    } else {
      setModalInitialData({
        nome: '',
        chamado: '',
        selectedCargoRef: null,
        proxima: type === 'chamado' ? 'Entrevista com o bispado' : 'Conversar com a pessoa',
        responsavel: 'Bispo',
        prazo: '',
        obs: '',
      });
    }

    setIsModalOpen(true);
  }

  async function handleSubmit(formData: ChamadoFormData) {
    try {
      await api.post('/pessoas', formData);
      setIsModalOpen(false);
      await Promise.all([loadPessoas(), loadSubOrgs()]);
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar');
    }
  }

  async function handleAdvanceChamado(id: string) {
    if (!canWrite) return;
    try {
      await api.post(`/pessoas/${id}/advance-chamado`);
      await Promise.all([loadPessoas(), loadSubOrgs()]);
    } catch (err: any) {
      alert(err.message || 'Erro ao avançar etapa');
    }
  }

  async function handleAdvanceDesob(id: string) {
    if (!canWrite) return;
    try {
      await api.post(`/pessoas/${id}/advance-desobrigacao`);
      await Promise.all([loadPessoas(), loadSubOrgs()]);
    } catch (err: any) {
      alert(err.message || 'Erro ao avançar desobrigação');
    }
  }

  async function handleReopen(id: string) {
    if (!canWrite) return;
    try {
      await api.post(`/pessoas/${id}/toggle`);
      await Promise.all([loadPessoas(), loadSubOrgs()]);
    } catch (err: any) {
      alert(err.message || 'Erro ao reabrir');
    }
  }

  async function handleCancel(id: string, nomeItem?: string, isDesobrigacao?: boolean) {
    if (!canWrite) return;
    const itemTipo = isDesobrigacao ? 'a desobrigação' : 'o chamado';
    const confirmMsg = nomeItem
      ? `Tem certeza que deseja cancelar ${itemTipo} de "${nomeItem}"?`
      : `Tem certeza que deseja cancelar ${itemTipo}?`;

    if (!confirm(confirmMsg)) return;

    try {
      await api.delete(`/pessoas/${id}`);
      await Promise.all([loadPessoas(), loadSubOrgs()]);
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar');
    }
  }

  if (!isBishopric) {
    return <div className="notice bisp">Acesso restrito aos membros do Bispado.</div>;
  }

  if (loading) {
    return <div className="empty">Carregando chamados e desobrigações…</div>;
  }

  const isDes = (p: Pessoa) => p.detalhe === 'Desobrigação';
  const openChamados = pessoas.filter(p => p.status !== 'concluido' && !isDes(p));
  const openDesob = pessoas.filter(p => p.status !== 'concluido' && isDes(p));
  const concluidos = pessoas.filter(p => p.status === 'concluido');
  const lateCount = pessoas.filter(p => p.status !== 'concluido' && p.prazo && p.prazo < today).length;

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h2>Chamados e desobrigações</h2>
          <p className="sub">
            Cada chamado da indicação até a designação, e cada desobrigação até o registro no LCR. Integrado com a Lista de Chamados.
          </p>
        </div>
        {canWrite && (
          <div className="btns">
            <button type="button" className="btn bisp" onClick={() => openModal('chamado')}>
              + Indicar chamado
            </button>
            <button type="button" className="btn" onClick={() => openModal('desob')}>
              + Desobrigação
            </button>
          </div>
        )}
      </div>

      <div className="notice bisp">
        <b>Somente o bispado vê esta página.</b> Nomes indicados ficam em sigilo até o apoio na reunião sacramental.
      </div>

      <ChamadosDesobrigacoesStatsCards
        openChamadosCount={openChamados.length}
        aguardandoAprovacaoCount={openChamados.filter(p => (!p.detalhe || p.detalhe === 'Indicado')).length}
        vagasCount={vagasList.length}
        vagasComIndicacaoCount={vagasList.filter(v => v.cargo.pendente).length}
        openDesobCount={openDesob.length}
        desobConversadasCount={openDesob.filter(p => Number(p.dpasso || 0) >= 1).length}
        lateCount={lateCount}
      />

      <ChamadosDesobrigacoesViewTabs
        currentView={currentView}
        setCurrentView={setCurrentView}
        openChamadosCount={openChamados.length}
        vagasCount={vagasList.length}
        openDesobCount={openDesob.length}
        concluidosCount={concluidos.length}
      />

      {/* Tab: Chamados novos (Pipeline de 5 Etapas) */}
      {currentView === 'novos' && (
        <ChamadosDesobrigacoesPipelineList
          openChamados={openChamados}
          today={today}
          canWrite={canWrite}
          onAdvance={handleAdvanceChamado}
          onCancel={handleCancel}
        />
      )}

      {/* Tab: Vagas Abertas na Ala */}
      {currentView === 'vagos' && (
        <ChamadosDesobrigacoesVagosList
          vagasList={vagasList}
          canWrite={canWrite}
          onIndicar={preset => openModal('chamado', preset)}
        />
      )}

      {/* Tab: Desobrigações */}
      {currentView === 'desob' && (
        <ChamadosDesobrigacoesDesobList
          openDesob={openDesob}
          canWrite={canWrite}
          onAdvance={handleAdvanceDesob}
          onCancel={handleCancel}
        />
      )}

      {/* Tab: Concluídos */}
      {currentView === 'feitos' && (
        <ChamadosDesobrigacoesConcluidosList
          concluidos={concluidos}
          canWrite={canWrite}
          onReopen={handleReopen}
          onCancel={handleCancel}
        />
      )}

      {/* Modal: Indicar Chamado ou Nova Desobrigação */}
      <ChamadosDesobrigacoesModal
        isOpen={isModalOpen}
        modalTipo={modalTipo}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        suborgs={suborgs}
        members={members}
        memberCallingsMap={memberCallingsMap}
        occupiedCallingsList={occupiedCallingsList}
        initialData={modalInitialData}
      />
    </div>
  );
};
