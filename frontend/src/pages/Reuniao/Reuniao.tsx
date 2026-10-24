import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Ata, MeetingType, Designacao, Pessoa, Membro, Organizacao } from '../../types';
import { PAUTA } from './reuniaoConstants';
import { ReuniaoSelectionView } from './ReuniaoSelectionView';
import { ReuniaoHeader } from './ReuniaoHeader';
import { ReuniaoSectionItem } from './ReuniaoSectionItem';
import { ReuniaoNewTaskModal } from './ReuniaoNewTaskModal';
import { ReuniaoFooterActions } from './ReuniaoFooterActions';

export const Reuniao: React.FC = () => {
  const { isBishopric, canWrite } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeMeeting, setActiveMeeting] = useState<Ata | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['A', '1']));
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [timerText, setTimerText] = useState('0:00');
  const [confirmModal, setConfirmModal] = useState<'end' | 'discard' | null>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic widgets data
  const [members, setMembers] = useState<Membro[]>([]);
  const [liveDesignacoes, setLiveDesignacoes] = useState<Designacao[]>([]);
  const [livePessoas, setLivePessoas] = useState<Pessoa[]>([]);
  const [vagasCount, setVagasCount] = useState(0);

  // New task modal states
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskSectionKey, setNewTaskSectionKey] = useState('');

  // Auto-save debounce tracker
  const debounceTimers = useRef<Record<string, any>>({});

  useEffect(() => {
    loadOpenMeetings();
    loadMeetingContextData();
  }, [location.state]);

  async function loadMeetingContextData() {
    try {
      const [membersRes, desRes, pessoasRes, chamadosRes] = await Promise.all([
        api.get<{ members: Membro[] }>('/membros').catch(() => ({ members: [] })),
        api.get<Designacao[]>('/designacoes').catch(() => []),
        api.get<Pessoa[]>('/pessoas').catch(() => []),
        api.get<Organizacao[]>('/chamados/organizacoes').catch(() => []),
      ]);
      setMembers(membersRes.members || []);
      setLiveDesignacoes(desRes || []);
      setLivePessoas(pessoasRes || []);
      let vCount = 0;
      (chamadosRes || []).forEach(org => {
        (org.cargos || []).forEach(c => {
          if (!c.pessoa && !c.fixo) vCount++;
        });
      });
      setVagasCount(vCount);
    } catch (err) {
      console.error('Erro ao carregar contexto de reunião:', err);
    }
  }

  function openCreateTaskModal(secKey: string) {
    setNewTaskSectionKey(secKey);
    setIsNewTaskModalOpen(true);
  }

  async function handleCreateTaskSubmit(titulo: string, responsavel: string, prazo: string) {
    if (!titulo.trim() || !activeMeeting) return;
    try {
      await api.post('/designacoes', {
        titulo: titulo.trim(),
        responsavel: responsavel.trim(),
        prazo,
        origem: activeMeeting.tipo,
        ataId: activeMeeting.id,
        status: 'pendente',
      });
      setIsNewTaskModalOpen(false);

      // Auto-annotate into current section notes
      const currentNote = activeMeeting.notas?.[newTaskSectionKey] || '';
      const addition = `[Designação: "${titulo.trim()}" -> ${responsavel.trim()} (até ${prazo})]`;
      const updatedNote = currentNote ? `${currentNote}\n${addition}` : addition;
      handleNoteChange(newTaskSectionKey, updatedNote);

      // Refresh live designações list
      const desRes = await api.get<Designacao[]>('/designacoes');
      setLiveDesignacoes(desRes || []);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar designação');
    }
  }

  async function handleCycleTaskInMeeting(taskId: string, origem: 'bispado' | 'conselho') {
    try {
      await api.post(`/designacoes/${taskId}/cycle`, { origem });
      const desRes = await api.get<Designacao[]>('/designacoes');
      setLiveDesignacoes(desRes || []);
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status');
    }
  }

  async function handleAdvanceChamadoInMeeting(pessoaId: string) {
    if (!confirm('Aprovar e avançar a etapa deste chamado?')) return;
    try {
      await api.post(`/pessoas/${pessoaId}/advance-chamado`);
      const pessoasRes = await api.get<Pessoa[]>('/pessoas');
      setLivePessoas(pessoasRes || []);
    } catch (err: any) {
      alert(err.message || 'Erro ao avançar chamado');
    }
  }

  async function loadOpenMeetings() {
    try {
      const atas = await api.get<Ata[]>('/atas');
      const live = atas.filter(a => a.status === 'aberta');

      const targetId = (location.state as any)?.meetingId;
      if (targetId) {
        const found = live.find(m => m.id === targetId) || atas.find(m => m.id === targetId);
        if (found) {
          setActiveMeeting({ ...found, status: 'aberta' });
          if (found.tipo && PAUTA[found.tipo]) {
            setOpenSections(new Set([PAUTA[found.tipo][0].k]));
          }
          setLoading(false);
          return;
        }
      }

      if (live.length === 1) {
        setActiveMeeting(live[0]);
      } else {
        setActiveMeeting(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Timer loop
  useEffect(() => {
    if (!activeMeeting?.inicioEm) return;

    const interval = setInterval(() => {
      const elapsedSec = Math.max(0, Math.floor((Date.now() - activeMeeting.inicioEm!) / 1000));
      const mins = Math.floor(elapsedSec / 60);
      const secs = String(elapsedSec % 60).padStart(2, '0');
      setTimerText(`${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeMeeting]);

  function handleNoteChange(key: string, value: string) {
    if (!activeMeeting || !canWrite) return;

    setActiveMeeting(prev => {
      if (!prev) return null;
      return {
        ...prev,
        notas: {
          ...prev.notas,
          [key]: value,
        },
      };
    });

    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }

    debounceTimers.current[key] = setTimeout(async () => {
      try {
        await api.post(`/reunioes/${activeMeeting.id}/note`, {
          tipo: activeMeeting.tipo,
          key,
          value,
        });
      } catch (err) {
        console.error('Failed to auto-save note:', err);
      }
    }, 600);
  }

  async function handleTratadoToggle(secKey: string, checked: boolean) {
    if (!activeMeeting || !canWrite) return;

    setActiveMeeting(prev => {
      if (!prev) return null;
      return {
        ...prev,
        tratados: {
          ...prev.tratados,
          [secKey]: checked,
        },
      };
    });

    try {
      await api.post(`/reunioes/${activeMeeting.id}/tratado`, {
        tipo: activeMeeting.tipo,
        sec: secKey,
        checked,
      });

      if (checked) {
        const pauta = PAUTA[activeMeeting.tipo];
        const idx = pauta.findIndex(s => s.k === secKey);
        if (pauta[idx + 1]) {
          setOpenSections(prev => new Set([...prev, pauta[idx + 1].k]));
        }
      }
    } catch (err) {
      console.error('Failed to toggle tratado:', err);
    }
  }

  async function startMeeting(tipo: MeetingType) {
    try {
      const res = await api.post('/reunioes/start', { tipo, data: meetingDate });
      setActiveMeeting(res);
      setOpenSections(new Set([PAUTA[tipo][0].k]));
    } catch (err: any) {
      alert(err.message || 'Erro ao iniciar reunião');
    }
  }

  async function endMeeting() {
    if (!activeMeeting) return;
    try {
      await api.post(`/reunioes/${activeMeeting.id}/end`, { tipo: activeMeeting.tipo });
      setConfirmModal(null);
      navigate('/atas');
    } catch (err: any) {
      alert(err.message || 'Erro ao encerrar reunião');
    }
  }

  async function discardMeeting() {
    if (!activeMeeting) return;
    try {
      await api.delete(`/reunioes/${activeMeeting.id}/discard?tipo=${activeMeeting.tipo}`);
      setConfirmModal(null);
      setActiveMeeting(null);
      loadOpenMeetings();
    } catch (err: any) {
      alert(err.message || 'Erro ao descartar reunião');
    }
  }

  function toggleSection(secKey: string) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(secKey)) next.delete(secKey);
      else next.add(secKey);
      return next;
    });
  }

  if (loading) {
    return <div className="empty">Carregando reunião…</div>;
  }

  // Meeting not active: show selection screen
  if (!activeMeeting) {
    return (
      <ReuniaoSelectionView
        meetingDate={meetingDate}
        setMeetingDate={setMeetingDate}
        canWrite={canWrite}
        isBishopric={isBishopric}
        onStartMeeting={startMeeting}
      />
    );
  }

  // Active meeting view
  const pauta = PAUTA[activeMeeting.tipo];
  const tratados = activeMeeting.tratados || {};
  const doneCount = pauta.filter(s => tratados[s.k]).length;
  const progressPct = Math.round((doneCount / pauta.length) * 100);

  return (
    <div className={`stack mt-${activeMeeting.tipo}`}>
      <ReuniaoHeader
        activeMeeting={activeMeeting}
        timerText={timerText}
        doneCount={doneCount}
        pautaLength={pauta.length}
        progressPct={progressPct}
        canWrite={canWrite}
        onNoteChange={handleNoteChange}
      />

      <div className="pauta">
        {pauta.map(sec => {
          const isOpen = openSections.has(sec.k);
          const isDone = Boolean(tratados[sec.k]);
          const noteText = activeMeeting.notas?.[sec.k] || '';

          return (
            <ReuniaoSectionItem
              key={sec.k}
              sec={sec}
              isOpen={isOpen}
              isDone={isDone}
              noteText={noteText}
              meetingTipo={activeMeeting.tipo}
              canWrite={canWrite}
              liveDesignacoes={liveDesignacoes}
              livePessoas={livePessoas}
              vagasCount={vagasCount}
              onToggleSection={toggleSection}
              onNoteChange={handleNoteChange}
              onTratadoToggle={handleTratadoToggle}
              onOpenCreateTaskModal={openCreateTaskModal}
              onCycleTask={handleCycleTaskInMeeting}
              onAdvanceChamado={handleAdvanceChamadoInMeeting}
            />
          );
        })}
      </div>

      {/* Modal: Nova Designação Direta na Reunião */}
      <ReuniaoNewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        activeMeeting={activeMeeting}
        members={members}
        onSubmit={handleCreateTaskSubmit}
      />

      <ReuniaoFooterActions
        confirmModal={confirmModal}
        setConfirmModal={setConfirmModal}
        canWrite={canWrite}
        onEndMeeting={endMeeting}
        onDiscardMeeting={discardMeeting}
        onExitActiveMeeting={() => setActiveMeeting(null)}
      />
    </div>
  );
};
