import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Atividade, AprovacaoAtividade, AtividadeStatus, FinanceiroTrimestre, LancamentoFinanceiro } from '../../types';
import { getDaysUntil, getStatus, isUserSolicitante } from './atividadesUtils';
import { AtividadeCard } from './AtividadeCard';
import { AtividadesStatsCards } from './AtividadesStatsCards';
import { AtividadesFilterTabs, AtividadeTabKey } from './AtividadesFilterTabs';
import { AtividadesHowItWorks } from './AtividadesHowItWorks';
import { AtividadeDetailModal } from './AtividadeDetailModal';
import { AtividadeFormModal, AtividadeFormData } from './AtividadeFormModal';
import { AtividadeFeedbackModal, FeedbackData } from './AtividadeFeedbackModal';

export const Atividades: React.FC = () => {
  const { user, isBishopric, canWrite } = useAuth();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [aprovacoes, setAprovacoes] = useState<Record<string, AprovacaoAtividade>>({});
  const [orcamentos, setOrcamentos] = useState<Record<string, FinanceiroTrimestre>>({});
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab filter
  const [activeTab, setActiveTab] = useState<AtividadeTabKey>('principal');
  const [bishopricScope, setBishopricScope] = useState<'todos' | 'meus'>('todos');

  // Proposal / Edit modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingAtv, setEditingAtv] = useState<Atividade | null>(null);

  // Detail / Decision Modal
  const [selectedAtv, setSelectedAtv] = useState<Atividade | null>(null);
  const [customRecipientEmail, setCustomRecipientEmail] = useState('');
  const [showEmailEdit, setShowEmailEdit] = useState(false);
  const [decisionComment, setDecisionComment] = useState('');
  const [addToAgenda, setAddToAgenda] = useState(true);
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  // Feedback Modal
  const [feedbackAtv, setFeedbackAtv] = useState<Atividade | null>(null);

  useEffect(() => {
    loadAtividades();
    loadFinanceiro();
  }, []);

  async function loadAtividades() {
    try {
      const res = await api.get<{ atividades: Atividade[]; aprovacoes: Record<string, AprovacaoAtividade> }>('/atividades');
      setAtividades(res.atividades || []);
      setAprovacoes(res.aprovacoes || {});
    } catch (err) {
      console.error('Erro ao carregar atividades:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadFinanceiro() {
    try {
      const res = await api.get<{ orcamentos: Record<string, FinanceiroTrimestre>; lancamentos: LancamentoFinanceiro[] }>('/financeiro/data');
      if (res.orcamentos) setOrcamentos(res.orcamentos);
      if (res.lancamentos) setLancamentos(res.lancamentos);
    } catch (err) {
      console.debug('Financeiro não carregado para atividades:', err);
    }
  }

  function openTicket(a: Atividade) {
    setSelectedAtv(a);
    setCustomRecipientEmail(a.solicitante?.email || '');
    setShowEmailEdit(false);
    setDecisionComment(aprovacoes[a.id]?.comentario || '');
  }

  function openNewModal(atvToEdit?: Atividade) {
    setEditingAtv(atvToEdit || null);
    setIsNewModalOpen(true);
  }

  async function handleProposalSubmit(payload: AtividadeFormData) {
    try {
      if (editingAtv) {
        await api.put(`/atividades/${editingAtv.id}`, payload);
        alert('Solicitação atualizada e reenviada ao Bispado com sucesso!');
      } else {
        await api.post('/atividades', payload);
        alert('Solicitação de atividade enviada ao Bispado com sucesso!');
      }

      setIsNewModalOpen(false);
      setEditingAtv(null);
      loadAtividades();
    } catch (err: any) {
      alert(err.message || 'Erro ao submeter atividade');
    }
  }

  async function handleDecide(status: AtividadeStatus) {
    if (!selectedAtv) return;

    if ((status === 'ajustes' || status === 'recusada') && !decisionComment.trim()) {
      return alert(
        status === 'recusada'
          ? 'Por favor, informe a justificativa do porque a atividade foi reprovada.'
          : 'Por favor, descreva quais alterações são necessárias para a organização.'
      );
    }

    setSubmittingDecision(true);
    try {
      const res = await api.post<{
        emailResult?: { success: boolean; error?: string; simulated?: boolean; messageId?: string };
        recipientEmail?: string;
      }>(`/atividades/${selectedAtv.id}/decide`, {
        status,
        comentario: decisionComment,
        addToAgenda,
        emailDestinatario: customRecipientEmail.trim() || undefined,
      });

      let statusMsg =
        status === 'aprovada'
          ? 'Atividade aprovada com sucesso!'
          : status === 'ajustes'
          ? 'Ticket retornado à organização com as orientações de ajuste!'
          : 'Atividade não aprovada registrada.';

      if (res.emailResult?.success) {
        statusMsg += `\n\n✉️ Notificação enviada por e-mail para: ${res.recipientEmail || customRecipientEmail}!`;
      } else if (res.emailResult?.simulated) {
        statusMsg += '\n\n⚠️ Aviso: O e-mail foi simulado (configure variáveis SMTP no Render).';
      }

      alert(statusMsg);
      setSelectedAtv(null);
      setDecisionComment('');
      loadAtividades();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar decisão');
    } finally {
      setSubmittingDecision(false);
    }
  }

  async function handleDelete(atv: Atividade) {
    if (!window.confirm(`Tem certeza que deseja excluir a solicitação "${atv.titulo}"?`)) return;
    try {
      await api.delete(`/atividades/${atv.id}`);
      setSelectedAtv(null);
      loadAtividades();
      alert('Solicitação excluída com sucesso.');
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir atividade');
    }
  }

  async function handleTestEmail() {
    const defaultEmail = user?.email || '';
    const targetEmail = prompt('Digite o e-mail de destino para testar o envio de e-mails pelo Render:', defaultEmail);
    if (!targetEmail || !targetEmail.trim()) return;

    setTestingEmail(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/atividades/test-email', {
        email: targetEmail.trim(),
      });
      alert(res.message || 'E-mail de teste enviado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao testar e-mail:', err);
      alert(`Falha no envio de e-mail:\n${err.message || 'Verifique as configurações SMTP no Render.'}`);
    } finally {
      setTestingEmail(false);
    }
  }

  async function handleFeedbackSubmit(data: FeedbackData) {
    if (!feedbackAtv) return;

    try {
      await api.post(`/atividades/${feedbackAtv.id}/feedback`, data);
      setFeedbackAtv(null);
      loadAtividades();
      alert('Feedback enviado ao bispado com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar feedback');
    }
  }

  // Base list depending on user permissions and bishopric toggle
  const baseList = useMemo(() => {
    if (!isBishopric) {
      return atividades.filter(a => isUserSolicitante(a, user));
    }
    return bishopricScope === 'meus' ? atividades.filter(a => isUserSolicitante(a, user)) : atividades;
  }, [atividades, isBishopric, bishopricScope, user]);

  // Grouped status lists
  const aguardando = useMemo(() => baseList.filter(a => getStatus(a, aprovacoes) === 'aguardando'), [baseList, aprovacoes]);
  const ajustes = useMemo(() => baseList.filter(a => getStatus(a, aprovacoes) === 'ajustes'), [baseList, aprovacoes]);
  const aprovadas = useMemo(() => baseList.filter(a => getStatus(a, aprovacoes) === 'aprovada'), [baseList, aprovacoes]);
  const recusadas = useMemo(() => baseList.filter(a => getStatus(a, aprovacoes) === 'recusada'), [baseList, aprovacoes]);

  // Upcoming vs Past approved
  const aprovadasProximas = useMemo(() => {
    return aprovadas.filter(a => {
      const diff = getDaysUntil(a.data);
      return diff === null || diff >= 0;
    });
  }, [aprovadas]);

  const realizadas = useMemo(() => {
    return baseList.filter(a => {
      const diff = getDaysUntil(a.data);
      return diff !== null && diff < 0;
    });
  }, [baseList]);

  // Metric 1: Aguardando com menos de 2 semanas
  const countMenosDe2Semanas = useMemo(() => {
    return aguardando.filter(a => {
      const diff = getDaysUntil(a.data);
      return diff !== null && diff >= 0 && diff <= 14;
    }).length;
  }, [aguardando]);

  // Metric 4: Custo previsto de aprovadas
  const aprovadasComCusto = useMemo(() => aprovadas.filter(a => a.custo === 'sim'), [aprovadas]);
  const totalCustoAprovadas = useMemo(() => {
    return aprovadasComCusto.reduce((sum, a) => sum + (Number(a.valor) || 0), 0);
  }, [aprovadasComCusto]);

  if (loading) {
    return <div className="empty">Carregando atividades da ala…</div>;
  }

  return (
    <div className="atv-page">
      {/* Header Area */}
      <div className="atv-header">
        <div className="atv-header-left">
          <div className="atv-flag-badge">⚑</div>
          <div>
            <h1 className="atv-title">Atividades</h1>
            <p className="atv-desc">
              As organizações planejam e enviam a atividade para o bispado aprovar. Toda atividade aparece aqui em vermelho até ser aprovada.
            </p>
          </div>
        </div>

        <div className="atv-header-actions">
          {isBishopric && (
            <button
              type="button"
              className="btn ghost sm"
              disabled={testingEmail}
              onClick={handleTestEmail}
              title="Testar conexão SMTP de e-mails configurada no Render"
            >
              {testingEmail ? '⏳ Testando...' : '✉️ Testar E-mail'}
            </button>
          )}

          {canWrite && (
            <button
              type="button"
              className="atv-btn-new"
              onClick={() => openNewModal()}
            >
              + Nova solicitação de atividade
            </button>
          )}
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <AtividadesStatsCards
        aguardandoCount={aguardando.length}
        countMenosDe2Semanas={countMenosDe2Semanas}
        aprovadasProximasCount={aprovadasProximas.length}
        ajustesCount={ajustes.length}
        totalCustoAprovadas={totalCustoAprovadas}
        aprovadasComCustoCount={aprovadasComCusto.length}
      />

      {/* Filter Tabs Bar */}
      <AtividadesFilterTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ajustesCount={ajustes.length}
        recusadasCount={recusadas.length}
        realizadasCount={realizadas.length}
        isBishopric={isBishopric}
        bishopricScope={bishopricScope}
        setBishopricScope={setBishopricScope}
        totalAtividadesCount={atividades.length}
        minhasAtividadesCount={atividades.filter(a => isUserSolicitante(a, user)).length}
      />

      {/* Main Content Areas based on Tab */}
      {activeTab === 'principal' && (
        <div className="atv-columns">
          {/* Column 1: Aguardando aprovação */}
          <section className="atv-col">
            <div className="atv-col-banner red">
              <span>Aguardando aprovação</span>
              <span className="atv-col-banner-count">{aguardando.length}</span>
            </div>

            {aguardando.length > 0 ? (
              aguardando.map(a => (
                <AtividadeCard key={a.id} a={a} aprovacoes={aprovacoes} onClick={openTicket} />
              ))
            ) : (
              <div className="atv-empty-box">
                Nenhuma atividade aguardando aprovação no momento.
              </div>
            )}
          </section>

          {/* Column 2: Atividades aprovadas */}
          <section className="atv-col">
            <div className="atv-col-banner green">
              <span>Atividades aprovadas</span>
              <span className="atv-col-banner-count">{aprovadasProximas.length}</span>
            </div>

            {aprovadasProximas.length > 0 ? (
              aprovadasProximas.map(a => (
                <AtividadeCard key={a.id} a={a} aprovacoes={aprovacoes} onClick={openTicket} />
              ))
            ) : (
              <div className="atv-empty-box">
                Nenhuma atividade aprovada para os próximos dias.
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'ajustes' && (
        <div className="atv-col">
          <div className="atv-col-banner blue">
            <span>Ajustes solicitados pela liderança</span>
            <span className="atv-col-banner-count">{ajustes.length}</span>
          </div>

          {ajustes.length > 0 ? (
            ajustes.map(a => (
              <AtividadeCard key={a.id} a={a} aprovacoes={aprovacoes} onClick={openTicket} />
            ))
          ) : (
            <div className="atv-empty-box">
              Nenhuma solicitação de atividade aguardando ajustes.
            </div>
          )}
        </div>
      )}

      {activeTab === 'recusadas' && (
        <div className="atv-col">
          <div className="atv-col-banner gray">
            <span>Solicitações não aprovadas</span>
            <span className="atv-col-banner-count">{recusadas.length}</span>
          </div>

          {recusadas.length > 0 ? (
            recusadas.map(a => (
              <AtividadeCard key={a.id} a={a} aprovacoes={aprovacoes} onClick={openTicket} />
            ))
          ) : (
            <div className="atv-empty-box">
              Nenhuma solicitação de atividade reprovada.
            </div>
          )}
        </div>
      )}

      {activeTab === 'realizadas' && (
        <div className="atv-col">
          <div className="atv-col-banner purple">
            <span>Atividades já realizadas</span>
            <span className="atv-col-banner-count">{realizadas.length}</span>
          </div>

          {realizadas.length > 0 ? (
            realizadas.map(a => (
              <AtividadeCard key={a.id} a={a} aprovacoes={aprovacoes} onClick={openTicket} />
            ))
          ) : (
            <div className="atv-empty-box">
              Nenhuma atividade realizada anterior registrada.
            </div>
          )}
        </div>
      )}

      {/* "Como funciona" Instructional Section */}
      <AtividadesHowItWorks />

      {/* Detail / Decision Popup Modal */}
      <AtividadeDetailModal
        selectedAtv={selectedAtv}
        onClose={() => setSelectedAtv(null)}
        aprovacoes={aprovacoes}
        isBishopric={isBishopric}
        canWrite={canWrite}
        orcamentos={orcamentos}
        lancamentos={lancamentos}
        decisionComment={decisionComment}
        setDecisionComment={setDecisionComment}
        customRecipientEmail={customRecipientEmail}
        setCustomRecipientEmail={setCustomRecipientEmail}
        showEmailEdit={showEmailEdit}
        setShowEmailEdit={setShowEmailEdit}
        addToAgenda={addToAgenda}
        setAddToAgenda={setAddToAgenda}
        submittingDecision={submittingDecision}
        onDecide={handleDecide}
        onEdit={atv => {
          setSelectedAtv(null);
          openNewModal(atv);
        }}
        onDelete={handleDelete}
        onOpenFeedback={atv => {
          setFeedbackAtv(atv);
          setSelectedAtv(null);
        }}
      />

      {/* Modal: Nova Solicitação ou Editar */}
      <AtividadeFormModal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setEditingAtv(null);
        }}
        editingAtv={editingAtv}
        aprovacoes={aprovacoes}
        user={user}
        onSubmit={handleProposalSubmit}
      />

      {/* Modal: Feedback Pós-Atividade */}
      <AtividadeFeedbackModal
        feedbackAtv={feedbackAtv}
        onClose={() => setFeedbackAtv(null)}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
};
