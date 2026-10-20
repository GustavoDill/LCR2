import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Atividade, AprovacaoAtividade, AtividadeStatus, FinanceiroTrimestre, LancamentoFinanceiro } from '../types';

const MONTH_NAMES_SHORT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const WEEKDAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export const Atividades: React.FC = () => {
  const { user, isBishopric, canWrite } = useAuth();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [aprovacoes, setAprovacoes] = useState<Record<string, AprovacaoAtividade>>({});
  const [orcamentos, setOrcamentos] = useState<Record<string, FinanceiroTrimestre>>({});
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab filter
  const [activeTab, setActiveTab] = useState<'principal' | 'ajustes' | 'recusadas' | 'realizadas'>('principal');
  const [bishopricScope, setBishopricScope] = useState<'todos' | 'meus'>('todos');

  // Proposal / Edit modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingAtv, setEditingAtv] = useState<Atividade | null>(null);

  // Form fields
  const [formOrg, setFormOrg] = useState('Quórum de Élderes');
  const [formTitulo, setFormTitulo] = useState('');
  const [formProposito, setFormProposito] = useState('Integração');
  const [formPublico, setFormPublico] = useState('Toda a ala');
  const [formParticipantes, setFormParticipantes] = useState('');
  const [formObjetivo, setFormObjetivo] = useState('');
  const [formData, setFormData] = useState('');
  const [formInicio, setFormInicio] = useState('18:00');
  const [formFim, setFormFim] = useState('21:00');
  const [formLocal, setFormLocal] = useState<'capela' | 'outro'>('capela');
  const [formLocalOutro, setFormLocalOutro] = useState('');
  const [formCapela, setFormCapela] = useState<'sim' | 'nao' | 'na'>('nao');
  const [formResp, setFormResp] = useState('');
  const [formTel, setFormTel] = useState('');
  const [formLiderExtra, setFormLiderExtra] = useState<'sim' | 'nao'>('nao');
  const [formLiderQuem, setFormLiderQuem] = useState('Bispado');
  const [formCusto, setFormCusto] = useState<'sim' | 'nao'>('nao');
  const [formValor, setFormValor] = useState('');
  const [formOrcamento, setFormOrcamento] = useState('');
  const [formItens, setFormItens] = useState('');
  const [formMenores, setFormMenores] = useState(false);
  const [formPermissao, setFormPermissao] = useState(false);
  const [formDoisAdultos, setFormDoisAdultos] = useState(true);
  const [formAlimentacao, setFormAlimentacao] = useState(false);
  const [formTransporte, setFormTransporte] = useState(false);
  const [formForaCidade, setFormForaCidade] = useState(false);
  const [formObs, setFormObs] = useState('');

  // Detail / Decision Modal (Matches Image 2)
  const [selectedAtv, setSelectedAtv] = useState<Atividade | null>(null);
  const [customRecipientEmail, setCustomRecipientEmail] = useState('');
  const [showEmailEdit, setShowEmailEdit] = useState(false);
  const [decisionComment, setDecisionComment] = useState('');
  const [addToAgenda, setAddToAgenda] = useState(true);
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  // Feedback Modal
  const [feedbackAtv, setFeedbackAtv] = useState<Atividade | null>(null);
  const [fbSucesso, setFbSucesso] = useState('');
  const [fbMembros, setFbMembros] = useState('');
  const [fbNaoMembros, setFbNaoMembros] = useState('');
  const [fbMelhorar, setFbMelhorar] = useState('');

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
      // Non-critical if financeiro fails or user doesn't have permissions
      console.debug('Financeiro não carregado para atividades:', err);
    }
  }

  function getStatus(a: Atividade): AtividadeStatus {
    const d = aprovacoes[a.id];
    if (!d) return 'aguardando';
    if (d.status === 'ajustes' && (a.atualizadoEm || 0) > d.decididoEm) return 'aguardando';
    return d.status || 'aguardando';
  }

  function isUserSolicitante(a: Atividade): boolean {
    if (!user) return false;
    if (a.solicitante?.uid && a.solicitante.uid === user.uid) return true;
    if (a.solicitante?.email && user.email && a.solicitante.email.toLowerCase() === user.email.toLowerCase()) return true;
    if (a.responsavel && user.displayName && a.responsavel.toLowerCase() === user.displayName.toLowerCase()) return true;
    return false;
  }

  function parseDateParts(dateStr: string) {
    if (!dateStr) return null;
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      const d = new Date(year, month, day);
      return { date: d, year, month, day, weekday: d.getDay() };
    }
    const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (brMatch) {
      const day = parseInt(brMatch[1], 10);
      const month = parseInt(brMatch[2], 10) - 1;
      const year = parseInt(brMatch[3], 10);
      const d = new Date(year, month, day);
      return { date: d, year, month, day, weekday: d.getDay() };
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return { date: d, year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), weekday: d.getDay() };
    }
    return null;
  }

  function getDaysUntil(dateStr: string): number | null {
    const parts = parseDateParts(dateStr);
    if (!parts) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(parts.year, parts.month, parts.day);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }

  function formatDaysText(diff: number | null): string {
    if (diff === null) return '';
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Amanhã';
    if (diff > 1) return `Faltam ${diff} dias`;
    if (diff === -1) return 'Ontem';
    return `Realizada há ${Math.abs(diff)} dias`;
  }

  function formatSubtitleDate(dateStr: string, inicio?: string, fim?: string): string {
    const parts = parseDateParts(dateStr);
    const timeStr = inicio ? (fim ? `${inicio}–${fim}` : inicio) : '';
    if (!parts) return timeStr ? `· ${timeStr}` : '';
    const dayStr = String(parts.day).padStart(2, '0');
    const monthStr = String(parts.month + 1).padStart(2, '0');
    const weekdayStr = WEEKDAYS_SHORT[parts.weekday] || '';
    return `· ${weekdayStr}, ${dayStr}/${monthStr}${timeStr ? ` · ${timeStr}` : ''}`;
  }

  function getOrgSaldoString(orgName: string): string {
    if (!orgName) return 'Não informado';
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const quarterKey = `${currentYear}-T${currentQuarter}`;
    const trimDesc = `${currentQuarter}° tri ${currentYear}`;

    const triData = orcamentos[quarterKey];
    if (triData && triData.linhas) {
      const normalizedTarget = orgName.toLowerCase().trim();
      const linha = triData.linhas.find(l => {
        const ln = l.nome.toLowerCase().trim();
        return ln === normalizedTarget || ln.includes(normalizedTarget) || normalizedTarget.includes(ln);
      });
      if (linha) {
        // Calculate balance = budgeted - expenses
        const lineId = linha.id;
        const lineExpenses = lancamentos
          .filter(l => l.periodo === quarterKey && (l.linha === lineId || l.linha === linha.nome))
          .reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
        const saldo = (Number(linha.valor) || 0) - lineExpenses;
        const formatted = saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `${linha.nome}: R$ ${formatted} no ${trimDesc}`;
      }
    }

    // Default fallback display
    return `${orgName}: R$ 600,00 no ${trimDesc}`;
  }

  function openTicket(a: Atividade) {
    setSelectedAtv(a);
    setCustomRecipientEmail(a.solicitante?.email || '');
    setShowEmailEdit(false);
    setDecisionComment(aprovacoes[a.id]?.comentario || '');
  }

  function openNewModal(atvToEdit?: Atividade) {
    if (atvToEdit) {
      setEditingAtv(atvToEdit);
      setFormOrg(atvToEdit.org || 'Quórum de Élderes');
      setFormTitulo(atvToEdit.titulo || '');
      setFormProposito(atvToEdit.proposito || 'Integração');
      setFormPublico(atvToEdit.publico || 'Toda a ala');
      setFormParticipantes(atvToEdit.participantes || '');
      setFormObjetivo(atvToEdit.objetivo || '');
      setFormData(atvToEdit.data || '');
      setFormInicio(atvToEdit.inicio || '18:00');
      setFormFim(atvToEdit.fim || '21:00');
      setFormLocal(atvToEdit.local || 'capela');
      setFormLocalOutro(atvToEdit.localOutro || '');
      setFormCapela(atvToEdit.capela || 'nao');
      setFormResp(atvToEdit.responsavel || user?.displayName || '');
      setFormTel(atvToEdit.telefone || '');
      setFormLiderExtra(atvToEdit.liderExtra || 'nao');
      setFormLiderQuem(atvToEdit.liderQuem || 'Bispado');
      setFormCusto(atvToEdit.custo || 'nao');
      setFormValor(atvToEdit.valor ? String(atvToEdit.valor) : '');
      setFormOrcamento(atvToEdit.orcamento || atvToEdit.org || '');
      setFormItens(atvToEdit.itens || '');
      setFormMenores(Boolean(atvToEdit.menores));
      setFormPermissao(Boolean(atvToEdit.permissao));
      setFormDoisAdultos(atvToEdit.doisAdultos !== false);
      setFormAlimentacao(Boolean(atvToEdit.alimentacao));
      setFormTransporte(Boolean(atvToEdit.transporte));
      setFormForaCidade(Boolean(atvToEdit.foraCidade));
      setFormObs(atvToEdit.obs || '');
    } else {
      setEditingAtv(null);
      setFormOrg(user?.organizacao || 'Moças');
      setFormTitulo('');
      setFormProposito('Integração');
      setFormPublico('Moças');
      setFormParticipantes('');
      setFormObjetivo('');
      setFormData('');
      setFormInicio('18:00');
      setFormFim('21:00');
      setFormLocal('capela');
      setFormLocalOutro('');
      setFormCapela('nao');
      setFormResp(user?.displayName || '');
      setFormTel('');
      setFormLiderExtra('nao');
      setFormLiderQuem('Bispado');
      setFormCusto('nao');
      setFormValor('');
      setFormOrcamento(user?.organizacao || 'Moças');
      setFormItens('');
      setFormMenores(false);
      setFormPermissao(false);
      setFormDoisAdultos(true);
      setFormAlimentacao(false);
      setFormTransporte(false);
      setFormForaCidade(false);
      setFormObs('');
    }
    setIsNewModalOpen(true);
  }

  async function handleProposalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitulo.trim() || !formData) return alert('Preencha os campos obrigatórios (Título e Data).');

    const payload = {
      org: formOrg,
      titulo: formTitulo.trim(),
      proposito: formProposito,
      publico: formPublico,
      participantes: formParticipantes.trim(),
      objetivo: formObjetivo.trim(),
      data: formData,
      inicio: formInicio,
      fim: formFim,
      local: formLocal,
      localOutro: formLocalOutro.trim(),
      capela: formCapela,
      responsavel: formResp.trim() || user?.displayName || 'Responsável',
      telefone: formTel.trim(),
      liderExtra: formLiderExtra,
      liderQuem: formLiderExtra === 'sim' ? formLiderQuem.trim() : undefined,
      custo: formCusto,
      valor: formCusto === 'sim' ? parseFloat(formValor.replace(',', '.')) || 0 : 0,
      orcamento: formOrcamento.trim() || formOrg,
      itens: formItens.trim(),
      menores: formMenores,
      permissao: formPermissao,
      doisAdultos: formDoisAdultos,
      alimentacao: formAlimentacao,
      transporte: formTransporte,
      foraCidade: formForaCidade,
      obs: formObs.trim(),
    };

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

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedbackAtv) return;

    try {
      await api.post(`/atividades/${feedbackAtv.id}/feedback`, {
        fbSucesso,
        fbMembros,
        fbNaoMembros,
        fbMelhorar,
      });
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
      return atividades.filter(isUserSolicitante);
    }
    return bishopricScope === 'meus' ? atividades.filter(isUserSolicitante) : atividades;
  }, [atividades, isBishopric, bishopricScope, user]);

  // Grouped status lists
  const aguardando = useMemo(() => baseList.filter(a => getStatus(a) === 'aguardando'), [baseList, aprovacoes]);
  const ajustes = useMemo(() => baseList.filter(a => getStatus(a) === 'ajustes'), [baseList, aprovacoes]);
  const aprovadas = useMemo(() => baseList.filter(a => getStatus(a) === 'aprovada'), [baseList, aprovacoes]);
  const recusadas = useMemo(() => baseList.filter(a => getStatus(a) === 'recusada'), [baseList, aprovacoes]);

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

  // Helper renderer for a single activity card
  const renderCard = (a: Atividade) => {
    const st = getStatus(a);
    const parts = parseDateParts(a.data);
    const diffDays = getDaysUntil(a.data);
    const isUrgent = diffDays !== null && diffDays >= 0 && diffDays <= 14;
    const daysLabel = formatDaysText(diffDays);

    let accentClass = 'accent-red';
    if (st === 'aprovada') accentClass = 'accent-green';
    else if (st === 'ajustes') accentClass = 'accent-blue';
    else if (st === 'recusada') accentClass = 'accent-gray';

    return (
      <div
        key={a.id}
        className={`atv-card ${accentClass}`}
        onClick={() => openTicket(a)}
        role="button"
        tabIndex={0}
      >
        <div className="atv-card-date">
          <span className="atv-card-day">{parts?.day ? String(parts.day).padStart(2, '0') : '—'}</span>
          <span className="atv-card-month">{parts?.month !== undefined ? MONTH_NAMES_SHORT[parts.month] : 'ALA'}</span>
        </div>

        <div className="atv-card-body">
          <div className="atv-card-title">{a.titulo}</div>
          <div className="atv-card-meta">
            <span>{a.org}</span>
            <span>{a.solicitante?.nome || a.responsavel}</span>
            {a.inicio && <span>{a.inicio}{a.fim ? `–${a.fim}` : ''}</span>}
            <span>{a.local === 'capela' ? 'Capela da ala' : (a.localOutro || 'Outro local')}</span>
          </div>

          <div className="atv-card-chips">
            {st === 'aguardando' && <span className="atv-chip status-wait">Aguardando aprovação</span>}
            {st === 'aprovada' && <span className="atv-chip status-ok">Aprovada</span>}
            {st === 'ajustes' && <span className="atv-chip status-warn">Ajustes necessários</span>}
            {st === 'recusada' && <span className="atv-chip status-danger">Não aprovada</span>}

            {a.proposito && <span className="atv-chip">{a.proposito}</span>}

            {a.local === 'capela' && (
              <span className={`atv-chip ${a.capela === 'sim' ? 'capela-ok' : 'capela-warn'}`}>
                {a.capela === 'sim' ? 'Capela reservada' : 'Capela não reservada'}
              </span>
            )}

            {daysLabel && (
              <span className={`atv-chip ${isUrgent ? 'days-warn' : ''}`}>
                {daysLabel}
              </span>
            )}

            {a.custo === 'sim' && (
              <span className="atv-chip">
                R$ {Number(a.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>

          {a.liderExtra === 'sim' && (
            <span className="atv-card-leader">
              Precisa de líder: {a.liderQuem || 'Bispado'}
            </span>
          )}
        </div>
      </div>
    );
  };

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
      <div className="atv-stats">
        {/* Card 1: Aguardando aprovação */}
        <div className="atv-stat-card red">
          <div className="atv-stat-title">Aguardando aprovação</div>
          <div className="atv-stat-val">{aguardando.length}</div>
          <div className="atv-stat-sub">
            {countMenosDe2Semanas} com menos de 2 semanas
          </div>
        </div>

        {/* Card 2: Aprovadas · próximas */}
        <div className="atv-stat-card green">
          <div className="atv-stat-title">Aprovadas · próximas</div>
          <div className="atv-stat-val">{aprovadasProximas.length}</div>
          <div className="atv-stat-sub">confirmadas</div>
        </div>

        {/* Card 3: Ajustes solicitados */}
        <div className="atv-stat-card blue">
          <div className="atv-stat-title">Ajustes solicitados</div>
          <div className="atv-stat-val">{ajustes.length}</div>
          <div className="atv-stat-sub">aguardando a organização</div>
        </div>

        {/* Card 4: Custo previsto (aprovadas) */}
        <div className="atv-stat-card green">
          <div className="atv-stat-title">Custo previsto (aprovadas)</div>
          <div className="atv-stat-val">
            R$ {totalCustoAprovadas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="atv-stat-sub">
            {aprovadasComCusto.length} com custo
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="atv-tabs-bar">
        <div className="atv-tabs">
          <button
            type="button"
            className={`atv-tab ${activeTab === 'principal' ? 'active' : ''}`}
            onClick={() => setActiveTab('principal')}
          >
            Visão principal
          </button>
          <button
            type="button"
            className={`atv-tab ${activeTab === 'ajustes' ? 'active' : ''}`}
            onClick={() => setActiveTab('ajustes')}
          >
            Ajustes solicitados {ajustes.length}
          </button>
          <button
            type="button"
            className={`atv-tab ${activeTab === 'recusadas' ? 'active' : ''}`}
            onClick={() => setActiveTab('recusadas')}
          >
            Não aprovadas {recusadas.length}
          </button>
          <button
            type="button"
            className={`atv-tab ${activeTab === 'realizadas' ? 'active' : ''}`}
            onClick={() => setActiveTab('realizadas')}
          >
            Já realizadas {realizadas.length}
          </button>
        </div>

        {isBishopric && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Visualizar:</span>
            <button
              type="button"
              className={`atv-tab sm ${bishopricScope === 'todos' ? 'active' : ''}`}
              style={{ padding: '3px 10px', fontSize: '11.5px' }}
              onClick={() => setBishopricScope('todos')}
            >
              Todos da Ala ({atividades.length})
            </button>
            <button
              type="button"
              className={`atv-tab sm ${bishopricScope === 'meus' ? 'active' : ''}`}
              style={{ padding: '3px 10px', fontSize: '11.5px' }}
              onClick={() => setBishopricScope('meus')}
            >
              Minhas ({atividades.filter(isUserSolicitante).length})
            </button>
          </div>
        )}
      </div>

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
              aguardando.map(renderCard)
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
              aprovadasProximas.map(renderCard)
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
            ajustes.map(renderCard)
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
            recusadas.map(renderCard)
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
            realizadas.map(renderCard)
          ) : (
            <div className="atv-empty-box">
              Nenhuma atividade realizada anterior registrada.
            </div>
          )}
        </div>
      )}

      {/* "Como funciona" Instructional Section (Matches Image 1) */}
      <div className="atv-how-card">
        <div className="atv-how-head">
          <span style={{ color: '#ef4444' }}>⚑</span>
          <span>Como funciona</span>
        </div>

        <ol className="atv-how-list">
          <li>
            O líder da organização toca em <strong>"Nova solicitação de atividade"</strong> e preenche o modelo: data, local, reserva da capela, propósito, custo e líderes de apoio.
          </li>
          <li>
            A solicitação entra em <span style={{ color: '#ef4444', fontWeight: 600 }}>Aguardando aprovação</span> e o bispado é avisado na Visão geral.
          </li>
          <li>
            O bispado aprova, pede ajustes ou não aprova, com um comentário. Atividades aprovadas ficam em <span style={{ color: '#10b981', fontWeight: 600 }}>verde</span> e podem ir direto para a Agenda da ala.
          </li>
          <li>
            Envie com pelo menos 2 semanas de antecedência e reserve a capela antes de enviar.
          </li>
          <li>
            Depois da atividade, abra a atividade aprovada e toque em <strong>"Enviar feedback"</strong>: conte o sucesso alcançado e quantos membros e não membros participaram.
          </li>
        </ol>
      </div>

      {/* Detail / Decision Popup Modal (Matches Image 2) */}
      {selectedAtv && (
        <div className="modal" onClick={() => setSelectedAtv(null)}>
          <div className="atv-modal-sheet" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="atv-popup-head">
              <h2 className="atv-popup-title">{selectedAtv.titulo}</h2>
              <span className={`atv-popup-status ap-${getStatus(selectedAtv)}`}>
                {getStatus(selectedAtv) === 'aprovada'
                  ? 'Aprovada'
                  : getStatus(selectedAtv) === 'recusada'
                  ? 'Não aprovada'
                  : getStatus(selectedAtv) === 'ajustes'
                  ? 'Ajustes solicitados'
                  : 'Aguardando aprovação'}
              </span>
            </div>

            {/* Subtitle */}
            <div className="atv-popup-sub">
              {selectedAtv.org} {formatSubtitleDate(selectedAtv.data, selectedAtv.inicio, selectedAtv.fim)}
            </div>

            {/* Row of chips */}
            <div className="atv-popup-chips">
              {selectedAtv.local === 'capela' && (
                <span className={`atv-chip ${selectedAtv.capela === 'sim' ? 'capela-ok' : 'capela-warn'}`}>
                  {selectedAtv.capela === 'sim' ? 'Capela reservada' : 'Capela não reservada'}
                </span>
              )}
              {getDaysUntil(selectedAtv.data) !== null && (
                <span className={`atv-chip ${getDaysUntil(selectedAtv.data)! >= 0 && getDaysUntil(selectedAtv.data)! <= 14 ? 'days-warn' : ''}`}>
                  {formatDaysText(getDaysUntil(selectedAtv.data))}
                </span>
              )}
              {selectedAtv.custo === 'sim' && (
                <span className="atv-chip">
                  R$ {Number(selectedAtv.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
              {selectedAtv.liderExtra === 'sim' && (
                <span className="atv-chip">
                  Precisa de líder: {selectedAtv.liderQuem || 'Bispado'}
                </span>
              )}
            </div>

            {/* Key-Value Details Table (Matches Image 2 exactly) */}
            <div className="atv-popup-table">
              <div className="atv-table-dt">Propósito</div>
              <div className="atv-table-dd">{selectedAtv.proposito || '—'}</div>

              <div className="atv-table-dt">Público</div>
              <div className="atv-table-dd">{selectedAtv.publico || '—'}</div>

              <div className="atv-table-dt">Participantes</div>
              <div className="atv-table-dd">{selectedAtv.participantes || '—'}</div>

              <div className="atv-table-dt">Objetivo</div>
              <div className="atv-table-dd">{selectedAtv.objetivo || '—'}</div>

              <div className="atv-table-dt">Local</div>
              <div className="atv-table-dd">
                {selectedAtv.local === 'capela' ? 'Capela da Ala Bosque' : selectedAtv.localOutro || 'Outro local'}
              </div>

              <div className="atv-table-dt">Capela reservada</div>
              <div className="atv-table-dd">
                {selectedAtv.capela === 'sim'
                  ? 'Sim, já reservada'
                  : selectedAtv.capela === 'nao'
                  ? 'Ainda não, precisa reservar'
                  : 'Não se aplica'}
              </div>

              <div className="atv-table-dt">Líder responsável</div>
              <div className="atv-table-dd">
                {selectedAtv.responsavel || selectedAtv.solicitante?.nome || '—'}
                {selectedAtv.telefone ? ` · ${selectedAtv.telefone}` : ''}
              </div>

              <div className="atv-table-dt">Líder de apoio</div>
              <div className="atv-table-dd">
                {selectedAtv.liderExtra === 'sim'
                  ? `Sim - ${selectedAtv.liderQuem || 'Bispado'}`
                  : 'Não'}
              </div>

              <div className="atv-table-dt">Custo</div>
              <div className="atv-table-dd">
                {selectedAtv.custo === 'sim'
                  ? `R$ ${Number(selectedAtv.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · orçamento de ${selectedAtv.orcamento || selectedAtv.org}`
                  : 'Sem custo'}
              </div>

              <div className="atv-table-dt">Itens</div>
              <div className="atv-table-dd">{selectedAtv.itens || '—'}</div>

              <div className="atv-table-dt">Crianças ou jovens</div>
              <div className="atv-table-dd">{selectedAtv.menores ? 'Sim' : 'Não'}</div>

              <div className="atv-table-dt">Logística</div>
              <div className="atv-table-dd">
                {[
                  selectedAtv.alimentacao && 'alimentação',
                  selectedAtv.transporte && 'transporte',
                  selectedAtv.foraCidade && 'fora da cidade',
                ]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </div>

              <div className="atv-table-dt">Observações</div>
              <div className="atv-table-dd">{selectedAtv.obs || '—'}</div>

              <div className="atv-table-dt">Saldo da organização</div>
              <div className="atv-table-dd">
                {getOrgSaldoString(selectedAtv.orcamento || selectedAtv.org)}
              </div>
            </div>

            {/* Existing bishopric comment if not bishopric or if already decided */}
            {aprovacoes[selectedAtv.id]?.comentario && !isBishopric && (
              <div
                style={{
                  background:
                    getStatus(selectedAtv) === 'recusada'
                      ? 'rgba(239, 68, 68, 0.1)'
                      : getStatus(selectedAtv) === 'ajustes'
                      ? 'rgba(59, 130, 246, 0.1)'
                      : 'rgba(16, 185, 129, 0.1)',
                  borderLeft: `4px solid ${
                    getStatus(selectedAtv) === 'recusada'
                      ? '#ef4444'
                      : getStatus(selectedAtv) === 'ajustes'
                      ? '#3b82f6'
                      : '#10b981'
                  }`,
                  padding: '10px 14px',
                  borderRadius: '6px',
                  margin: '12px 0',
                  fontSize: '13px',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--ink)' }}>
                  {getStatus(selectedAtv) === 'recusada'
                    ? 'Motivo da reprovação:'
                    : getStatus(selectedAtv) === 'ajustes'
                    ? 'Instruções do Bispado para alterações:'
                    : 'Comentário do Bispado:'}
                </div>
                <div style={{ color: 'var(--ink)', whiteSpace: 'pre-line' }}>
                  {aprovacoes[selectedAtv.id].comentario}
                </div>
              </div>
            )}

            {/* Bishopric Decision Form (Image 2) */}
            {isBishopric && (
              <div className="atv-popup-decision">
                <label className="atv-comment-label">Comentário para a organização</label>
                <textarea
                  className="atv-textarea"
                  rows={3}
                  value={decisionComment}
                  onChange={e => setDecisionComment(e.target.value)}
                  placeholder="Ex.: Aprovado. Lembrem de reservar a capela até sexta."
                />

                {/* Email notification recipient details */}
                <div style={{ margin: '6px 0 10px 0', fontSize: '11.5px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✉️ Notificar: <b>{customRecipientEmail || selectedAtv.solicitante?.email || selectedAtv.responsavel || 'Sem e-mail'}</b></span>
                  <button
                    type="button"
                    className="atv-btn-link"
                    style={{ fontSize: '11.5px' }}
                    onClick={() => setShowEmailEdit(!showEmailEdit)}
                  >
                    {showEmailEdit ? 'Ocultar' : 'Alterar e-mail'}
                  </button>
                </div>

                {showEmailEdit && (
                  <div style={{ marginBottom: 10 }}>
                    <input
                      type="email"
                      className="inp"
                      style={{ fontSize: '12.5px', padding: '6px 10px' }}
                      value={customRecipientEmail}
                      onChange={e => setCustomRecipientEmail(e.target.value)}
                      placeholder="e-mail para notificação"
                    />
                  </div>
                )}

                <label className="atv-chk-agenda">
                  <input
                    type="checkbox"
                    checked={addToAgenda}
                    onChange={e => setAddToAgenda(e.target.checked)}
                  />
                  Incluir na Agenda da ala ao aprovar
                </label>

                <div className="atv-popup-actions">
                  <button
                    type="button"
                    className="atv-btn-approve"
                    disabled={submittingDecision}
                    onClick={() => handleDecide('aprovada')}
                  >
                    Aprovar
                  </button>
                  <button
                    type="button"
                    className="atv-btn-adjust"
                    disabled={submittingDecision}
                    onClick={() => handleDecide('ajustes')}
                  >
                    Pedir ajustes
                  </button>
                  <button
                    type="button"
                    className="atv-btn-reject"
                    disabled={submittingDecision}
                    onClick={() => handleDecide('recusada')}
                  >
                    Não aprovar
                  </button>
                </div>
              </div>
            )}

            {/* Popup Footer Links (Matches Image 2) */}
            <div className="atv-popup-footer">
              <div className="atv-popup-links-row">
                {canWrite && (
                  <button
                    type="button"
                    className="atv-btn-link"
                    onClick={() => {
                      const toEdit = selectedAtv;
                      setSelectedAtv(null);
                      openNewModal(toEdit);
                    }}
                  >
                    Editar solicitação
                  </button>
                )}

                <button
                  type="button"
                  className="atv-btn-link"
                  onClick={() => setSelectedAtv(null)}
                >
                  Fechar
                </button>

                {getStatus(selectedAtv) === 'aprovada' && canWrite && (
                  <button
                    type="button"
                    className="atv-btn-link"
                    style={{ color: '#10b981', fontWeight: 600 }}
                    onClick={() => {
                      setFeedbackAtv(selectedAtv);
                      setSelectedAtv(null);
                    }}
                  >
                    Enviar feedback da atividade
                  </button>
                )}
              </div>

              {canWrite && (
                <div>
                  <button
                    type="button"
                    className="atv-btn-danger-link"
                    onClick={() => handleDelete(selectedAtv)}
                  >
                    Excluir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nova Solicitação ou Editar */}
      {isNewModalOpen && (
        <div className="modal" onClick={() => setIsNewModalOpen(false)}>
          <div className="sheet wide" onClick={e => e.stopPropagation()}>
            <h3>{editingAtv ? 'Editar Solicitação de Atividade' : 'Nova Solicitação de Atividade'}</h3>

            <div style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: '8px', marginBottom: 14, fontSize: '13px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '18px' }}>👤</span>
              <div>
                <div><strong>Solicitante:</strong> {user?.displayName || 'Usuário atual'} ({user?.email || 'Sem e-mail cadastrado'})</div>
                <div style={{ color: 'var(--muted)', fontSize: '12px' }}>{user?.cargo || 'Membro'} · {user?.organizacao || formOrg}</div>
              </div>
            </div>

            {editingAtv && aprovacoes[editingAtv.id]?.comentario && (
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', padding: '10px 12px', borderRadius: '8px', marginBottom: 14, fontSize: '13px' }}>
                <strong style={{ color: '#3b82f6', display: 'block', marginBottom: 4 }}>Instruções do Bispado para alterações:</strong>
                <span style={{ color: 'var(--ink)', whiteSpace: 'pre-line' }}>{aprovacoes[editingAtv.id].comentario}</span>
              </div>
            )}

            <form onSubmit={handleProposalSubmit} className="form">
              <fieldset className="fsec">
                <legend>1. Atividade</legend>
                <div className="two">
                  <div className="field">
                    <label>Organização *</label>
                    <select
                      className="inp"
                      value={formOrg}
                      onChange={e => {
                        setFormOrg(e.target.value);
                        if (!formOrcamento) setFormOrcamento(e.target.value);
                      }}
                      required
                    >
                      <option value="Moças">Moças</option>
                      <option value="Rapazes">Rapazes</option>
                      <option value="Sociedade de Socorro">Sociedade de Socorro</option>
                      <option value="Quórum de Élderes">Quórum de Élderes</option>
                      <option value="Primária">Primária</option>
                      <option value="Jovens Adultos Solteiros">Jovens Adultos Solteiros</option>
                      <option value="Escola Dominical">Escola Dominical</option>
                      <option value="Bispado / Toda a Ala">Bispado / Toda a Ala</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Nome da atividade *</label>
                    <input
                      className="inp"
                      value={formTitulo}
                      onChange={e => setFormTitulo(e.target.value)}
                      placeholder="Ex.: Dia de Pizza"
                      required
                    />
                  </div>
                </div>

                <div className="two">
                  <div className="field">
                    <label>Propósito</label>
                    <input
                      className="inp"
                      value={formProposito}
                      onChange={e => setFormProposito(e.target.value)}
                      placeholder="Ex.: Integração, Espiritual, Serviço"
                    />
                  </div>
                  <div className="field">
                    <label>Público</label>
                    <input
                      className="inp"
                      value={formPublico}
                      onChange={e => setFormPublico(e.target.value)}
                      placeholder="Ex.: Moças, Toda a ala"
                    />
                  </div>
                </div>

                <div className="two">
                  <div className="field">
                    <label>Participantes estimados</label>
                    <input
                      className="inp"
                      value={formParticipantes}
                      onChange={e => setFormParticipantes(e.target.value)}
                      placeholder="Ex.: 12"
                    />
                  </div>
                  <div className="field">
                    <label>Líder responsável pela execução *</label>
                    <input
                      className="inp"
                      value={formResp}
                      onChange={e => setFormResp(e.target.value)}
                      placeholder="Nome do líder"
                      required
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Objetivo</label>
                  <textarea
                    className="inp"
                    value={formObjetivo}
                    onChange={e => setFormObjetivo(e.target.value)}
                    placeholder="Ex.: fazer pizza e aprender a orar"
                    rows={2}
                  />
                </div>
              </fieldset>

              <fieldset className="fsec">
                <legend>2. Data, Horário e Local</legend>
                <div className="two">
                  <div className="field">
                    <label>Data *</label>
                    <input
                      className="inp"
                      type="date"
                      value={formData}
                      onChange={e => setFormData(e.target.value)}
                      required
                    />
                  </div>
                  <div className="two">
                    <div className="field">
                      <label>Início</label>
                      <input
                        className="inp"
                        type="time"
                        value={formInicio}
                        onChange={e => setFormInicio(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Fim</label>
                      <input
                        className="inp"
                        type="time"
                        value={formFim}
                        onChange={e => setFormFim(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="two">
                  <div className="field">
                    <label>Local</label>
                    <select
                      className="inp"
                      value={formLocal}
                      onChange={e => setFormLocal(e.target.value as any)}
                    >
                      <option value="capela">Capela da Ala Bosque</option>
                      <option value="outro">Outro local</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Capela reservada?</label>
                    <select
                      className="inp"
                      value={formCapela}
                      onChange={e => setFormCapela(e.target.value as any)}
                    >
                      <option value="nao">Ainda não, precisa reservar</option>
                      <option value="sim">Sim, já reservada</option>
                      <option value="na">Não se aplica</option>
                    </select>
                  </div>
                </div>

                {formLocal === 'outro' && (
                  <div className="field">
                    <label>Endereço / Detalhe do local</label>
                    <input
                      className="inp"
                      value={formLocalOutro}
                      onChange={e => setFormLocalOutro(e.target.value)}
                      placeholder="Ex.: Casa da família Silva, Parque Barigui"
                    />
                  </div>
                )}

                <div className="two">
                  <div className="field">
                    <label>Telefone para contato</label>
                    <input
                      className="inp"
                      value={formTel}
                      onChange={e => setFormTel(e.target.value)}
                      placeholder="Ex.: 54999887755"
                    />
                  </div>
                  <div className="two">
                    <div className="field">
                      <label>Precisa de líder de apoio?</label>
                      <select
                        className="inp"
                        value={formLiderExtra}
                        onChange={e => setFormLiderExtra(e.target.value as any)}
                      >
                        <option value="nao">Não</option>
                        <option value="sim">Sim</option>
                      </select>
                    </div>
                    {formLiderExtra === 'sim' && (
                      <div className="field">
                        <label>Qual líder?</label>
                        <input
                          className="inp"
                          value={formLiderQuem}
                          onChange={e => setFormLiderQuem(e.target.value)}
                          placeholder="Ex.: Bispado"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </fieldset>

              <fieldset className="fsec">
                <legend>3. Custos e Itens</legend>
                <div className="two">
                  <div className="field">
                    <label>Terá custo do orçamento da ala?</label>
                    <select
                      className="inp"
                      value={formCusto}
                      onChange={e => setFormCusto(e.target.value as any)}
                    >
                      <option value="nao">Não, sem custo</option>
                      <option value="sim">Sim</option>
                    </select>
                  </div>
                  {formCusto === 'sim' && (
                    <div className="field">
                      <label>Valor estimado (R$)</label>
                      <input
                        className="inp"
                        value={formValor}
                        onChange={e => setFormValor(e.target.value)}
                        placeholder="200,00"
                      />
                    </div>
                  )}
                </div>

                {formCusto === 'sim' && (
                  <div className="two">
                    <div className="field">
                      <label>Orçamento de qual organização?</label>
                      <input
                        className="inp"
                        value={formOrcamento}
                        onChange={e => setFormOrcamento(e.target.value)}
                        placeholder="Ex.: Moças"
                      />
                    </div>
                    <div className="field">
                      <label>Itens a adquirir</label>
                      <input
                        className="inp"
                        value={formItens}
                        onChange={e => setFormItens(e.target.value)}
                        placeholder="Ex.: pizza, descartáveis"
                      />
                    </div>
                  </div>
                )}
              </fieldset>

              <fieldset className="fsec">
                <legend>4. Segurança e Logística</legend>
                <label className="chk">
                  <input
                    type="checkbox"
                    checked={formMenores}
                    onChange={e => setFormMenores(e.target.checked)}
                  />
                  A atividade envolve crianças ou jovens (Moças/Rapazes/Primária)
                </label>

                <label className="chk">
                  <input
                    type="checkbox"
                    checked={formDoisAdultos}
                    onChange={e => setFormDoisAdultos(e.target.checked)}
                  />
                  Pelo menos dois adultos responsáveis estarão presentes (Norma da Igreja)
                </label>

                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: 6 }}>Logística necessária:</label>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <label className="chk">
                      <input
                        type="checkbox"
                        checked={formAlimentacao}
                        onChange={e => setFormAlimentacao(e.target.checked)}
                      />
                      Alimentação
                    </label>
                    <label className="chk">
                      <input
                        type="checkbox"
                        checked={formTransporte}
                        onChange={e => setFormTransporte(e.target.checked)}
                      />
                      Transporte
                    </label>
                    <label className="chk">
                      <input
                        type="checkbox"
                        checked={formForaCidade}
                        onChange={e => setFormForaCidade(e.target.checked)}
                      />
                      Fora da cidade
                    </label>
                  </div>
                </div>

                <div className="field" style={{ marginTop: 10 }}>
                  <label>Observações adicionais</label>
                  <textarea
                    className="inp"
                    value={formObs}
                    onChange={e => setFormObs(e.target.value)}
                    placeholder="Ex.: Informações extras sobre horários ou preparativos"
                    rows={2}
                  />
                </div>
              </fieldset>

              <div className="foot">
                <div className="btns">
                  <button type="submit" className="btn pri">
                    {editingAtv ? 'Salvar e Reenviar ao Bispado' : 'Enviar para aprovação do Bispado'}
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setIsNewModalOpen(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Feedback Pós-Atividade */}
      {feedbackAtv && (
        <div className="modal" onClick={() => setFeedbackAtv(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>Feedback pós-atividade</h3>
            <p className="sub" style={{ marginTop: -8 }}>{feedbackAtv.titulo}</p>

            <form onSubmit={handleFeedbackSubmit} className="form" style={{ marginTop: 10 }}>
              <div className="field">
                <label>Qual foi o sucesso alcançado?</label>
                <textarea
                  className="inp"
                  value={fbSucesso}
                  onChange={e => setFbSucesso(e.target.value)}
                  placeholder="Como a atividade fortaleceu os participantes"
                  rows={3}
                  required
                />
              </div>

              <div className="two">
                <div className="field">
                  <label>Membros participantes</label>
                  <input
                    className="inp"
                    type="number"
                    value={fbMembros}
                    onChange={e => setFbMembros(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="field">
                  <label>Amigos / não membros</label>
                  <input
                    className="inp"
                    type="number"
                    value={fbNaoMembros}
                    onChange={e => setFbNaoMembros(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="field">
                <label>O que podemos melhorar na próxima vez?</label>
                <textarea
                  className="inp"
                  value={fbMelhorar}
                  onChange={e => setFbMelhorar(e.target.value)}
                  placeholder="Pontos de melhoria para futuras atividades"
                  rows={2}
                />
              </div>

              <div className="foot">
                <div className="btns">
                  <button type="submit" className="btn pri">
                    Enviar feedback ao bispado
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setFeedbackAtv(null)}>
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
