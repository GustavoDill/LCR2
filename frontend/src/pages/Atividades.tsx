import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Atividade, AprovacaoAtividade, AtividadeStatus } from '../types';
import { Icon } from '../components/Icons';

export const Atividades: React.FC = () => {
  const { user, isBishopric, canWrite } = useAuth();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [aprovacoes, setAprovacoes] = useState<Record<string, AprovacaoAtividade>>({});
  const [loading, setLoading] = useState(true);
  const [filterView, setFilterView] = useState<'todos' | 'meus'>('todos');

  // Proposal / Edit modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingAtv, setEditingAtv] = useState<Atividade | null>(null);

  const [formOrg, setFormOrg] = useState('Quórum de Élderes');
  const [formTitulo, setFormTitulo] = useState('');
  const [formProposito, setFormProposito] = useState('Integração');
  const [formPublico, setFormPublico] = useState('Toda a ala');
  const [formObjetivo, setFormObjetivo] = useState('');
  const [formData, setFormData] = useState('');
  const [formInicio, setFormInicio] = useState('19:00');
  const [formFim, setFormFim] = useState('21:00');
  const [formLocal, setFormLocal] = useState<'capela' | 'outro'>('capela');
  const [formLocalOutro, setFormLocalOutro] = useState('');
  const [formCapela, setFormCapela] = useState<'sim' | 'nao' | 'na'>('sim');
  const [formResp, setFormResp] = useState('');
  const [formTel, setFormTel] = useState('');
  const [formCusto, setFormCusto] = useState<'sim' | 'nao'>('nao');
  const [formValor, setFormValor] = useState('');
  const [formMenores, setFormMenores] = useState(false);
  const [formPermissao, setFormPermissao] = useState(false);
  const [formDoisAdultos, setFormDoisAdultos] = useState(true);

  // Decision Modal (Bishopric)
  const [selectedAtv, setSelectedAtv] = useState<Atividade | null>(null);
  const [customRecipientEmail, setCustomRecipientEmail] = useState('');
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
  }, []);

  async function loadAtividades() {
    try {
      const res = await api.get<{ atividades: Atividade[]; aprovacoes: Record<string, AprovacaoAtividade> }>('/atividades');
      setAtividades(res.atividades || []);
      setAprovacoes(res.aprovacoes || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  function openTicket(a: Atividade) {
    setSelectedAtv(a);
    setCustomRecipientEmail(a.solicitante?.email || '');
    setDecisionComment(aprovacoes[a.id]?.comentario || '');
  }

  function openNewModal(atvToEdit?: Atividade) {
    if (atvToEdit) {
      setEditingAtv(atvToEdit);
      setFormOrg(atvToEdit.org || 'Quórum de Élderes');
      setFormTitulo(atvToEdit.titulo || '');
      setFormProposito(atvToEdit.proposito || 'Integração');
      setFormPublico(atvToEdit.publico || 'Toda a ala');
      setFormObjetivo(atvToEdit.objetivo || '');
      setFormData(atvToEdit.data || '');
      setFormInicio(atvToEdit.inicio || '19:00');
      setFormFim(atvToEdit.fim || '21:00');
      setFormLocal(atvToEdit.local || 'capela');
      setFormLocalOutro(atvToEdit.localOutro || '');
      setFormCapela(atvToEdit.capela || 'sim');
      setFormResp(atvToEdit.responsavel || user?.displayName || '');
      setFormTel(atvToEdit.telefone || '');
      setFormCusto(atvToEdit.custo || 'nao');
      setFormValor(atvToEdit.valor ? String(atvToEdit.valor) : '');
      setFormMenores(Boolean(atvToEdit.menores));
      setFormPermissao(Boolean(atvToEdit.permissao));
      setFormDoisAdultos(atvToEdit.doisAdultos !== false);
    } else {
      setEditingAtv(null);
      setFormOrg(user?.organizacao || 'Quórum de Élderes');
      setFormTitulo('');
      setFormProposito('Integração');
      setFormPublico('Toda a ala');
      setFormObjetivo('');
      setFormData('');
      setFormInicio('19:00');
      setFormFim('21:00');
      setFormLocal('capela');
      setFormLocalOutro('');
      setFormCapela('sim');
      setFormResp(user?.displayName || '');
      setFormTel('');
      setFormCusto('nao');
      setFormValor('');
      setFormMenores(false);
      setFormPermissao(false);
      setFormDoisAdultos(true);
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
      objetivo: formObjetivo,
      data: formData,
      inicio: formInicio,
      fim: formFim,
      local: formLocal,
      localOutro: formLocalOutro,
      capela: formCapela,
      responsavel: formResp.trim() || user?.displayName || 'Responsável',
      telefone: formTel,
      liderExtra: 'nao',
      custo: formCusto,
      valor: formCusto === 'sim' ? parseFloat(formValor.replace(',', '.')) || 0 : 0,
      menores: formMenores,
      permissao: formPermissao,
      doisAdultos: formDoisAdultos,
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
          ? 'Por favor, informe a justificativa do porque a atividade foi reprovada. O solicitante receberá esta descrição por e-mail.'
          : 'Por favor, descreva quais alterações são necessárias. O solicitante receberá estas instruções por e-mail.'
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
          ? 'Ticket retornado ao solicitante com as instruções de alteração!'
          : 'Atividade reprovada com sucesso.';

      if (res.emailResult?.success) {
        statusMsg += `\n\n✉️ Notificação enviada por e-mail com sucesso para: ${res.recipientEmail || customRecipientEmail}!`;
      } else if (res.emailResult?.simulated) {
        statusMsg += '\n\n⚠️ Aviso: O e-mail foi apenas simulado no console do Render (verifique variáveis SMTP_HOST, SMTP_USER e SMTP_PASS).';
      } else if (res.emailResult && !res.emailResult.success) {
        statusMsg += `\n\n⚠️ Aviso sobre e-mail: Não foi possível entregar a mensagem (${res.emailResult.error || 'Erro no envio'}). O ticket foi atualizado, mas verifique as configurações no Render.`;
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
      alert(`Falha no envio de e-mail pelo Render:\n${err.message || 'Erro desconhecido. Verifique os logs no Render.'}`);
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

  if (loading) {
    return <div className="empty">Carregando atividades da ala…</div>;
  }

  // Bispado pode ver todos os tickets. Solicitantes regulares veem apenas o que solicitaram.
  const baseList = isBishopric
    ? (filterView === 'meus' ? atividades.filter(isUserSolicitante) : atividades)
    : atividades.filter(isUserSolicitante);

  const aguardando = baseList.filter(a => getStatus(a) === 'aguardando');
  const ajustes = baseList.filter(a => getStatus(a) === 'ajustes');
  const aprovadas = baseList.filter(a => getStatus(a) === 'aprovada');
  const recusadas = baseList.filter(a => getStatus(a) === 'recusada');

  const myTicketsCount = atividades.filter(isUserSolicitante).length;

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h2>{isBishopric ? 'Solicitações de Atividades (Bispado)' : 'Minhas Solicitações de Atividades'}</h2>
          <p className="sub">
            {isBishopric
              ? 'Painel de tickets de atividades da ala. O Bispado pode aprovar, pedir alterações ou recusar com justificativa.'
              : 'Acompanhe o status das atividades que você planejou e enviou para aprovação do Bispado.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {isBishopric && (
            <button
              type="button"
              className="btn ghost sm"
              disabled={testingEmail}
              onClick={handleTestEmail}
              title="Testar se as credenciais do Gmail configuradas no Render estão funcionando"
            >
              {testingEmail ? '⏳ Testando...' : '✉️ Testar E-mail'}
            </button>
          )}
          {canWrite && (
            <button type="button" className="btn bisp" onClick={() => openNewModal()}>
              + Nova solicitação de atividade
            </button>
          )}
        </div>
      </div>

      {/* Tabs de Filtro: Visíveis para o Bispado */}
      {isBishopric ? (
        <div className="seg" role="tablist">
          <button
            type="button"
            className={filterView === 'todos' ? 'on' : ''}
            onClick={() => setFilterView('todos')}
          >
            <Icon name="checks" /> Todos os Tickets <span className="num" style={{ opacity: 0.7 }}>{atividades.length}</span>
          </button>
          <button
            type="button"
            className={filterView === 'meus' ? 'on' : ''}
            onClick={() => setFilterView('meus')}
          >
            <Icon name="userplus" /> Minhas Solicitações <span className="num" style={{ opacity: 0.7 }}>{myTicketsCount}</span>
          </button>
        </div>
      ) : (
        <div className="notice" style={{ marginBlock: 8, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📋</span>
          <span>Você está visualizando apenas as <b>suas solicitações de atividade</b>. O Bispado receberá e analisará seus tickets.</span>
        </div>
      )}

      {baseList.length === 0 && (
        <div className="notice bisp" style={{ marginBlock: 8 }}>
          {isBishopric
            ? 'Nenhuma solicitação de atividade encontrada.'
            : 'Você ainda não possui solicitações de atividades criadas em seu nome. Clique em "+ Nova solicitação de atividade" para enviar uma proposta ao Bispado.'}
        </div>
      )}

      {/* Colunas do Fluxo de Tickets */}
      <div className="act-cols">
        {/* Coluna 1: Aguardando Aprovação */}
        <section className="act-col">
          <div className="act-ch wait">
            <span>Aguardando aprovação</span>
            <span className="num">{aguardando.length}</span>
          </div>

          {aguardando.length ? (
            aguardando.map(a => (
              <button
                key={a.id}
                type="button"
                className="act-card st-aguardando"
                onClick={() => openTicket(a)}
              >
                <div className="act-main">
                  <span className="act-t">{a.titulo}</span>
                  <span className="row-m">
                    <span>{a.org}</span>
                    <span>{a.data}</span>
                    {a.inicio && <span>{a.inicio}</span>}
                  </span>
                  <span className="row-m" style={{ marginTop: 2, fontSize: '11.5px', color: 'var(--muted)' }}>
                    <span>👤 Solicitante: <b>{a.solicitante?.nome || a.responsavel}</b></span>
                  </span>
                  <div className="act-chips" style={{ marginTop: 6 }}>
                    <span className="apill ap-aguardando">Aguardando Bispado</span>
                    <span className="flag">{a.proposito}</span>
                    {a.custo === 'sim' && <span className="flag">R$ {a.valor}</span>}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="empty">Nenhuma atividade aguardando aprovação.</div>
          )}
        </section>

        {/* Coluna 2: Alterações Solicitadas */}
        <section className="act-col">
          <div className="act-ch warn">
            <span>Ajustes solicitados</span>
            <span className="num">{ajustes.length}</span>
          </div>

          {ajustes.length ? (
            ajustes.map(a => (
              <div
                key={a.id}
                className="act-card st-ajustes"
                style={{ flexDirection: 'column', gap: 8 }}
                onClick={() => openTicket(a)}
              >
                <div className="act-main" style={{ width: '100%' }}>
                  <span className="act-t">{a.titulo}</span>
                  <span className="row-m">
                    <span>{a.org}</span>
                    <span>{a.data}</span>
                  </span>
                  <span className="row-m" style={{ marginTop: 2, fontSize: '11.5px', color: 'var(--muted)' }}>
                    <span>👤 Solicitante: <b>{a.solicitante?.nome || a.responsavel}</b></span>
                  </span>

                  {aprovacoes[a.id]?.comentario && (
                    <div style={{ background: 'rgba(217, 119, 6, 0.1)', borderLeft: '3px solid #d97706', padding: '6px 8px', borderRadius: '4px', marginTop: 6, fontSize: '12px' }}>
                      <strong style={{ color: '#d97706', display: 'block', marginBottom: 2 }}>O que precisa mudar:</strong>
                      <span style={{ color: 'var(--ink)' }}>{aprovacoes[a.id].comentario}</span>
                    </div>
                  )}

                  <div className="act-chips" style={{ marginTop: 8 }}>
                    <span className="apill ap-ajustes">Ajustes necessários</span>
                    {canWrite && (
                      <button
                        type="button"
                        className="btn sm"
                        style={{ padding: '3px 8px', fontSize: '11.5px', marginLeft: 'auto' }}
                        onClick={e => {
                          e.stopPropagation();
                          openNewModal(a);
                        }}
                      >
                        ✏️ Editar e Reenviar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty">Nenhum pedido de ajuste pendente.</div>
          )}
        </section>

        {/* Coluna 3: Aprovadas */}
        <section className="act-col">
          <div className="act-ch ok">
            <span>Atividades aprovadas</span>
            <span className="num">{aprovadas.length}</span>
          </div>

          {aprovadas.length ? (
            aprovadas.map(a => (
              <button
                key={a.id}
                type="button"
                className="act-card st-aprovada"
                onClick={() => openTicket(a)}
              >
                <div className="act-main">
                  <span className="act-t">{a.titulo}</span>
                  <span className="row-m">
                    <span>{a.org}</span>
                    <span>{a.data}</span>
                  </span>
                  <span className="row-m" style={{ marginTop: 2, fontSize: '11.5px', color: 'var(--muted)' }}>
                    <span>👤 Solicitante: <b>{a.solicitante?.nome || a.responsavel}</b></span>
                  </span>
                  <div className="act-chips" style={{ marginTop: 6 }}>
                    <span className="apill ap-aprovada">Aprovada</span>
                    <span className="flag good">Confirmada</span>
                    {a.fbSucesso && <span className="flag good">Feedback enviado</span>}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="empty">Nenhuma atividade aprovada no momento.</div>
          )}
        </section>

        {/* Coluna 4: Não Aprovadas / Recusadas */}
        <section className="act-col">
          <div className="act-ch danger">
            <span>Não aprovadas</span>
            <span className="num">{recusadas.length}</span>
          </div>

          {recusadas.length ? (
            recusadas.map(a => (
              <button
                key={a.id}
                type="button"
                className="act-card st-recusada"
                onClick={() => openTicket(a)}
              >
                <div className="act-main">
                  <span className="act-t">{a.titulo}</span>
                  <span className="row-m">
                    <span>{a.org}</span>
                    <span>{a.data}</span>
                  </span>
                  <span className="row-m" style={{ marginTop: 2, fontSize: '11.5px', color: 'var(--muted)' }}>
                    <span>👤 Solicitante: <b>{a.solicitante?.nome || a.responsavel}</b></span>
                  </span>

                  {aprovacoes[a.id]?.comentario && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', borderLeft: '3px solid var(--crit)', padding: '6px 8px', borderRadius: '4px', marginTop: 6, fontSize: '12px' }}>
                      <strong style={{ color: 'var(--crit)', display: 'block', marginBottom: 2 }}>Motivo da recusa:</strong>
                      <span style={{ color: 'var(--ink)' }}>{aprovacoes[a.id].comentario}</span>
                    </div>
                  )}

                  <div className="act-chips" style={{ marginTop: 8 }}>
                    <span className="apill ap-recusada">Não aprovada</span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="empty">Nenhuma solicitação reprovada.</div>
          )}
        </section>
      </div>

      {/* Modal: Nova Atividade ou Editar/Reenviar */}
      {isNewModalOpen && (
        <div className="modal" onClick={() => setIsNewModalOpen(false)}>
          <div className="sheet wide" onClick={e => e.stopPropagation()}>
            <h3>{editingAtv ? 'Editar e Reenviar Solicitação de Atividade' : 'Nova Solicitação de Atividade'}</h3>

            {/* Caixa informativa do solicitante */}
            <div style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: '8px', marginBottom: 14, fontSize: '13px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '18px' }}>👤</span>
              <div>
                <div><strong>Solicitante atual:</strong> {user?.displayName || 'Usuário atual'} ({user?.email || 'Sem e-mail'})</div>
                <div style={{ color: 'var(--muted)', fontSize: '12px' }}>{user?.cargo || 'Membro'} · {user?.organizacao || formOrg}</div>
              </div>
            </div>

            {editingAtv && aprovacoes[editingAtv.id]?.comentario && (
              <div style={{ background: 'rgba(217, 119, 6, 0.12)', border: '1px solid #d97706', padding: '12px 14px', borderRadius: '8px', marginBottom: 14, fontSize: '13px' }}>
                <strong style={{ color: '#d97706', display: 'block', marginBottom: 4 }}>Instruções do Bispado para alteração:</strong>
                <span style={{ color: 'var(--ink)', whiteSpace: 'pre-line' }}>{aprovacoes[editingAtv.id].comentario}</span>
              </div>
            )}

            <form onSubmit={handleProposalSubmit} className="form">
              <fieldset className="fsec">
                <legend>1. Atividade</legend>
                <div className="two">
                  <div className="field">
                    <label>Organização *</label>
                    <input
                      className="inp"
                      value={formOrg}
                      onChange={e => setFormOrg(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Nome da atividade *</label>
                    <input
                      className="inp"
                      value={formTitulo}
                      onChange={e => setFormTitulo(e.target.value)}
                      placeholder="Ex.: Noite de talentos e integração"
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
                    />
                  </div>
                  <div className="field">
                    <label>Público</label>
                    <input
                      className="inp"
                      value={formPublico}
                      onChange={e => setFormPublico(e.target.value)}
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Objetivo e descrição</label>
                  <textarea
                    className="inp"
                    value={formObjetivo}
                    onChange={e => setFormObjetivo(e.target.value)}
                    placeholder="Como esta atividade fortalece os membros e as famílias"
                  />
                </div>
              </fieldset>

              <fieldset className="fsec">
                <legend>2. Data e local</legend>
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
                  {formLocal === 'outro' && (
                    <div className="field">
                      <label>Endereço / Detalhe do local</label>
                      <input
                        className="inp"
                        value={formLocalOutro}
                        onChange={e => setFormLocalOutro(e.target.value)}
                        placeholder="Ex.: Parque Barigui, Casa da família Silva"
                      />
                    </div>
                  )}
                </div>

                <div className="two">
                  <div className="field">
                    <label>Líder responsável pela execução *</label>
                    <input
                      className="inp"
                      value={formResp}
                      onChange={e => setFormResp(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Telefone para contato</label>
                    <input
                      className="inp"
                      value={formTel}
                      onChange={e => setFormTel(e.target.value)}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="fsec">
                <legend>3. Custos e Segurança</legend>
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
                        placeholder="0,00"
                      />
                    </div>
                  )}
                </div>

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
                  Pelo menos dois adultos responsáveis estarão presentes (Norma de segurança da Igreja)
                </label>
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

      {/* Modal: Detalhes do Ticket e Decisão do Bispado */}
      {selectedAtv && (
        <div className="modal" onClick={() => setSelectedAtv(null)}>
          <div className="sheet wide" onClick={e => e.stopPropagation()}>
            <div className="head" style={{ marginBottom: 8 }}>
              <h3>{selectedAtv.titulo}</h3>
              <span className={`apill ap-${getStatus(selectedAtv)}`}>
                {getStatus(selectedAtv) === 'aprovada'
                  ? 'Aprovada'
                  : getStatus(selectedAtv) === 'recusada'
                  ? 'Não aprovada'
                  : getStatus(selectedAtv) === 'ajustes'
                  ? 'Ajustes solicitados'
                  : 'Aguardando aprovação'}
              </span>
            </div>

            <p className="sub" style={{ marginBottom: 14 }}>
              {selectedAtv.org} · {selectedAtv.data} {selectedAtv.inicio && `às ${selectedAtv.inicio}`}
            </p>

            {/* Box com Dados do Solicitante */}
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', padding: '12px 14px', borderRadius: '8px', marginBottom: 14, fontSize: '13px' }}>
              <div style={{ fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>👤 Informações do Solicitante:</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px', color: 'var(--ink)' }}>
                <div><strong>Nome:</strong> {selectedAtv.solicitante?.nome || selectedAtv.responsavel}</div>
                <div><strong>E-mail:</strong> {selectedAtv.solicitante?.email || 'E-mail não registrado'}</div>
                <div><strong>Cargo:</strong> {selectedAtv.solicitante?.cargo || 'Líder'}</div>
                <div><strong>Organização:</strong> {selectedAtv.solicitante?.organizacao || selectedAtv.org}</div>
              </div>
            </div>

            <dl className="dl">
              <dt>Propósito</dt>
              <dd>{selectedAtv.proposito}</dd>
              <dt>Objetivo</dt>
              <dd>{selectedAtv.objetivo || '—'}</dd>
              <dt>Local</dt>
              <dd>{selectedAtv.local === 'capela' ? 'Capela da Ala Bosque' : selectedAtv.localOutro || 'Outro'}</dd>
              <dt>Custo</dt>
              <dd>{selectedAtv.custo === 'sim' ? `R$ ${selectedAtv.valor}` : 'Sem custo'}</dd>
              <dt>Responsável</dt>
              <dd>{selectedAtv.responsavel} {selectedAtv.telefone && `(${selectedAtv.telefone})`}</dd>
            </dl>

            {aprovacoes[selectedAtv.id]?.comentario && (
              <div
                className={`alert ${getStatus(selectedAtv) === 'recusada' ? 'a-crit' : getStatus(selectedAtv) === 'ajustes' ? 'a-warn' : 'a-exc'}`}
                style={{ marginTop: 14 }}
              >
                <b>
                  {getStatus(selectedAtv) === 'recusada'
                    ? 'Motivo da Não Aprovação:'
                    : getStatus(selectedAtv) === 'ajustes'
                    ? 'Orientações do Bispado para Alterações:'
                    : 'Comentário do Bispado:'}
                </b>
                <span style={{ whiteSpace: 'pre-line' }}>{aprovacoes[selectedAtv.id].comentario}</span>
              </div>
            )}

            {/* Ação rápida para o solicitante se o ticket estiver em ajustes */}
            {getStatus(selectedAtv) === 'ajustes' && canWrite && (
              <div style={{ marginTop: 14, background: 'rgba(217, 119, 6, 0.08)', border: '1px solid #d97706', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px' }}>Você pode editar os dados desta atividade com as correções solicitadas e reenviar ao bispado.</span>
                <button
                  type="button"
                  className="btn sm"
                  onClick={() => {
                    const toEdit = selectedAtv;
                    setSelectedAtv(null);
                    openNewModal(toEdit);
                  }}
                >
                  ✏️ Editar e Reenviar
                </button>
              </div>
            )}

            {/* Painel do Bispado para Tomar Decisão */}
            {isBishopric && (
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 18, paddingTop: 16 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>Decisão do Bispado (Ticket)</h4>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 10px 0' }}>
                  ✉️ Ao tomar uma decisão, um e-mail é enviado automaticamente para o solicitante.
                </p>

                <div className="field" style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>E-mail do Solicitante (Destinatário) *</span>
                    {!selectedAtv.solicitante?.email && (
                      <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>
                        ⚠️ Ticket sem e-mail cadastrado
                      </span>
                    )}
                  </label>
                  <input
                    type="email"
                    className="inp"
                    value={customRecipientEmail}
                    onChange={e => setCustomRecipientEmail(e.target.value)}
                    placeholder="ex: solicitante@gmail.com"
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px', display: 'block' }}>
                    O solicitante receberá a notificação da decisão neste endereço. Você pode confirmar ou alterar caso necessário.
                  </span>
                </div>

                <div className="field">
                  <label>Comentário / Motivo / Instruções para o Solicitante</label>
                  <textarea
                    className="inp"
                    value={decisionComment}
                    onChange={e => setDecisionComment(e.target.value)}
                    placeholder="Obrigatório ao recusar ou pedir ajustes. Descreva o motivo da reprovação ou o que a organização precisa alterar."
                    rows={3}
                  />
                </div>

                <label className="chk" style={{ marginBlock: 12 }}>
                  <input
                    type="checkbox"
                    checked={addToAgenda}
                    onChange={e => setAddToAgenda(e.target.checked)}
                  />
                  Incluir automaticamente na Agenda oficial da ala ao aprovar
                </label>

                <div className="btns" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn cons"
                    disabled={submittingDecision}
                    onClick={() => handleDecide('aprovada')}
                  >
                    ✓ Aprovar Atividade
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={submittingDecision}
                    onClick={() => handleDecide('ajustes')}
                  >
                    ⚠️ Pedir Alterações
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    disabled={submittingDecision}
                    onClick={() => handleDecide('recusada')}
                  >
                    ✕ Não Aprovar (Negar)
                  </button>
                </div>
              </div>
            )}

            <div className="foot" style={{ marginTop: 18 }}>
              <div className="btns">
                {getStatus(selectedAtv) === 'aprovada' && canWrite && (
                  <button
                    type="button"
                    className="btn bisp"
                    onClick={() => {
                      setFeedbackAtv(selectedAtv);
                      setSelectedAtv(null);
                    }}
                  >
                    Enviar feedback da atividade
                  </button>
                )}
                <button type="button" className="btn ghost" onClick={() => setSelectedAtv(null)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Feedback pós-atividade */}
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
                  />
                </div>
                <div className="field">
                  <label>Amigos / não membros</label>
                  <input
                    className="inp"
                    type="number"
                    value={fbNaoMembros}
                    onChange={e => setFbNaoMembros(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label>O que podemos melhorar na próxima vez?</label>
                <textarea
                  className="inp"
                  value={fbMelhorar}
                  onChange={e => setFbMelhorar(e.target.value)}
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
