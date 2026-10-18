import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Atividade, AprovacaoAtividade, AtividadeStatus } from '../types';

export const Atividades: React.FC = () => {
  const { isBishopric, canWrite } = useAuth();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [aprovacoes, setAprovacoes] = useState<Record<string, AprovacaoAtividade>>({});
  const [loading, setLoading] = useState(true);

  // Proposal modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
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
  const [decisionComment, setDecisionComment] = useState('');
  const [addToAgenda, setAddToAgenda] = useState(true);

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

  async function handleProposalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitulo.trim() || !formData) return alert('Preencha os campos obrigatórios.');

    try {
      await api.post('/atividades', {
        org: formOrg,
        titulo: formTitulo,
        proposito: formProposito,
        publico: formPublico,
        objetivo: formObjetivo,
        data: formData,
        inicio: formInicio,
        fim: formFim,
        local: formLocal,
        localOutro: formLocalOutro,
        capela: formCapela,
        responsavel: formResp,
        telefone: formTel,
        liderExtra: 'nao',
        custo: formCusto,
        valor: formCusto === 'sim' ? parseFloat(formValor.replace(',', '.')) || 0 : 0,
        menores: formMenores,
        permissao: formPermissao,
        doisAdultos: formDoisAdultos,
      });

      setIsNewModalOpen(false);
      loadAtividades();
      alert('Solicitação de atividade enviada ao Bispado com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao submeter atividade');
    }
  }

  async function handleDecide(status: AtividadeStatus) {
    if (!selectedAtv) return;
    try {
      await api.post(`/atividades/${selectedAtv.id}/decide`, {
        status,
        comentario: decisionComment,
        addToAgenda,
      });
      setSelectedAtv(null);
      loadAtividades();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar decisão');
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

  const aguardando = atividades.filter(a => getStatus(a) === 'aguardando');
  const aprovadas = atividades.filter(a => getStatus(a) === 'aprovada');

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h2>Atividades</h2>
          <p className="sub">
            As organizações planejam e enviam a atividade para o bispado aprovar.
          </p>
        </div>
        {canWrite && (
          <button type="button" className="btn bisp" onClick={() => setIsNewModalOpen(true)}>
            + Nova solicitação de atividade
          </button>
        )}
      </div>

      <div className="act-cols">
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
                onClick={() => setSelectedAtv(a)}
              >
                <div className="act-main">
                  <span className="act-t">{a.titulo}</span>
                  <span className="row-m">
                    <span>{a.org}</span>
                    <span>{a.data}</span>
                    {a.inicio && <span>{a.inicio}</span>}
                    <span>{a.responsavel}</span>
                  </span>
                  <div className="act-chips">
                    <span className="apill ap-aguardando">Aguardando aprovação</span>
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
                onClick={() => setSelectedAtv(a)}
              >
                <div className="act-main">
                  <span className="act-t">{a.titulo}</span>
                  <span className="row-m">
                    <span>{a.org}</span>
                    <span>{a.data}</span>
                    <span>{a.responsavel}</span>
                  </span>
                  <div className="act-chips">
                    <span className="apill ap-aprovada">Aprovada</span>
                    <span className="flag good">Capela reservada</span>
                    {a.fbSucesso && <span className="flag good">Feedback enviado</span>}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="empty">Nenhuma atividade aprovada no momento.</div>
          )}
        </section>
      </div>

      {/* Modal: Nova Atividade */}
      {isNewModalOpen && (
        <div className="modal" onClick={() => setIsNewModalOpen(false)}>
          <div className="sheet wide" onClick={e => e.stopPropagation()}>
            <h3>Solicitação de atividade</h3>
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
                      placeholder="Ex.: Noite de jogos e talentos"
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
                    placeholder="Como esta atividade fortalece os membros"
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
                    <label>Líder responsável *</label>
                    <input
                      className="inp"
                      value={formResp}
                      onChange={e => setFormResp(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Telefone</label>
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
                    <label>Terá custo?</label>
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
                  Pelo menos dois adultos responsáveis estarão presentes
                </label>
              </fieldset>

              <div className="foot">
                <div className="btns">
                  <button type="submit" className="btn pri">
                    Enviar para aprovação
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

      {/* Modal: Detalhes e Decisão do Bispado */}
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
                  : 'Aguardando aprovação'}
              </span>
            </div>

            <p className="sub" style={{ marginBottom: 14 }}>
              {selectedAtv.org} · {selectedAtv.data} · Resp: {selectedAtv.responsavel}
            </p>

            <dl className="dl">
              <dt>Propósito</dt>
              <dd>{selectedAtv.proposito}</dd>
              <dt>Objetivo</dt>
              <dd>{selectedAtv.objetivo || '—'}</dd>
              <dt>Local</dt>
              <dd>{selectedAtv.local === 'capela' ? 'Capela da Ala Bosque' : selectedAtv.localOutro}</dd>
              <dt>Custo</dt>
              <dd>{selectedAtv.custo === 'sim' ? `R$ ${selectedAtv.valor}` : 'Sem custo'}</dd>
            </dl>

            {aprovacoes[selectedAtv.id]?.comentario && (
              <div className="alert a-exc" style={{ marginTop: 12 }}>
                <b>Comentário do Bispado:</b>
                <span>{aprovacoes[selectedAtv.id].comentario}</span>
              </div>
            )}

            {isBishopric && (
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 16, paddingTop: 14 }}>
                <div className="field">
                  <label>Comentário para a organização</label>
                  <textarea
                    className="inp"
                    value={decisionComment}
                    onChange={e => setDecisionComment(e.target.value)}
                    placeholder="Instruções ou orientações do bispado"
                  />
                </div>

                <label className="chk" style={{ marginBlock: 10 }}>
                  <input
                    type="checkbox"
                    checked={addToAgenda}
                    onChange={e => setAddToAgenda(e.target.checked)}
                  />
                  Incluir automaticamente na Agenda da ala ao aprovar
                </label>

                <div className="btns">
                  <button
                    type="button"
                    className="btn cons"
                    onClick={() => handleDecide('aprovada')}
                  >
                    Aprovar
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => handleDecide('ajustes')}
                  >
                    Pedir ajustes
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    onClick={() => handleDecide('recusada')}
                  >
                    Não aprovar
                  </button>
                </div>
              </div>
            )}

            <div className="foot" style={{ marginTop: 16 }}>
              <div className="btns">
                {getStatus(selectedAtv) === 'aprovada' && (
                  <button
                    type="button"
                    className="btn bisp"
                    onClick={() => {
                      setFeedbackAtv(selectedAtv);
                      setSelectedAtv(null);
                    }}
                  >
                    Enviar feedback
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
            <h3>Feedback da atividade</h3>
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
