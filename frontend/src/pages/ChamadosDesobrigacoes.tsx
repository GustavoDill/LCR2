import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Pessoa } from '../types';
import { Icon } from '../components/Icons';

const CH_FLOW = ['Indicado', 'Aprovação do bispado', 'Entrevista', 'Apoio na sacramental', 'Designação'];
const D_FLOW = ['Conversar com a pessoa', 'Desobrigar na sacramental', 'Atualizar no LCR'];

export const ChamadosDesobrigacoes: React.FC = () => {
  const { isBishopric, canWrite } = useAuth();
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'novos' | 'desob' | 'feitos'>('novos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<'chamado' | 'desob'>('chamado');

  // Form states
  const [nome, setNome] = useState('');
  const [chamado, setChamado] = useState('');
  const [proxima, setProxima] = useState('');
  const [responsavel, setResponsavel] = useState('Bispo');
  const [prazo, setPrazo] = useState('');
  const [obs, setObs] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadPessoas();
  }, [isBishopric]);

  async function loadPessoas() {
    try {
      const data = await api.get<Pessoa[]>('/pessoas?tipo=chamado');
      setPessoas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openModal(type: 'chamado' | 'desob') {
    setModalTipo(type);
    setNome('');
    setChamado('');
    setProxima(type === 'chamado' ? 'Entrevista com o bispado' : 'Conversar com a pessoa');
    setResponsavel('Bispo');
    setPrazo('');
    setObs('');
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return alert('O nome é obrigatório.');

    try {
      await api.post('/pessoas', {
        nome,
        tipo: 'chamado',
        detalhe: modalTipo === 'chamado' ? 'Indicado' : 'Desobrigação',
        chamado,
        proxima,
        responsavel,
        prazo,
        obs,
      });
      setIsModalOpen(false);
      loadPessoas();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar');
    }
  }

  async function handleAdvanceChamado(id: string) {
    if (!canWrite) return;
    try {
      await api.post(`/pessoas/${id}/advance-chamado`);
      loadPessoas();
    } catch (err: any) {
      alert(err.message || 'Erro ao avançar etapa');
    }
  }

  async function handleAdvanceDesob(id: string) {
    if (!canWrite) return;
    try {
      await api.post(`/pessoas/${id}/advance-desobrigacao`);
      loadPessoas();
    } catch (err: any) {
      alert(err.message || 'Erro ao avançar desobrigação');
    }
  }

  async function handleReopen(id: string) {
    if (!canWrite) return;
    try {
      await api.post(`/pessoas/${id}/toggle`);
      loadPessoas();
    } catch (err: any) {
      alert(err.message || 'Erro ao reabrir');
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
            Cada chamado da indicação até a designação, e cada desobrigação até o registro no LCR.
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

      <div className="kgrid">
        <div className="kcard">
          <h4>Chamados em andamento</h4>
          <div className="kbody">
            <span className="kval">{openChamados.length}</span>
          </div>
          <div className="ksub">
            {openChamados.filter(p => (!p.detalhe || p.detalhe === 'Indicado')).length} aguardando aprovação
          </div>
        </div>

        <div className="kcard">
          <h4>Desobrigações pendentes</h4>
          <div className="kbody">
            <span className={`kval ${openDesob.length ? 's-norm' : ''}`}>{openDesob.length}</span>
          </div>
          <div className="ksub">
            {openDesob.filter(p => Number(p.dpasso || 0) >= 1).length} já conversadas
          </div>
        </div>

        <div className="kcard">
          <h4>Ações vencidas</h4>
          <div className="kbody">
            <span className={`kval ${lateCount ? 's-crit' : 's-exc'}`}>{lateCount}</span>
          </div>
          <div className={`ksub ${lateCount ? 's-crit' : ''}`}>
            {lateCount ? 'prazo passou' : 'tudo em dia'}
          </div>
        </div>

        <div className="kcard">
          <h4>Concluídos</h4>
          <div className="kbody">
            <span className="kval s-exc">{concluidos.length}</span>
          </div>
          <div className="ksub">registrados</div>
        </div>
      </div>

      <div className="seg" role="tablist">
        <button
          type="button"
          className={currentView === 'novos' ? 'on' : ''}
          onClick={() => setCurrentView('novos')}
        >
          <Icon name="userplus" /> Chamados novos <span className="num" style={{ opacity: 0.7 }}>{openChamados.length}</span>
        </button>
        <button
          type="button"
          className={currentView === 'desob' ? 'on' : ''}
          onClick={() => setCurrentView('desob')}
        >
          <Icon name="flag" /> Desobrigações <span className="num" style={{ opacity: 0.7 }}>{openDesob.length}</span>
        </button>
        <button
          type="button"
          className={currentView === 'feitos' ? 'on' : ''}
          onClick={() => setCurrentView('feitos')}
        >
          <Icon name="checks" /> Concluídos <span className="num" style={{ opacity: 0.7 }}>{concluidos.length}</span>
        </button>
      </div>

      {currentView === 'novos' && (
        <div className="board">
          {CH_FLOW.map((stage, k) => {
            const stagePessoas = openChamados.filter(p => (!p.detalhe && stage === 'Indicado') || p.detalhe === stage);

            return (
              <section key={stage} className="bcol">
                <header>
                  <span className="bn">{k + 1}</span>
                  <b>{stage}</b>
                  <span className="c num">{stagePessoas.length}</span>
                </header>

                {stagePessoas.length ? (
                  stagePessoas.map(p => {
                    const isOverdue = p.prazo && p.prazo < today;
                    const nextStageIndex = CH_FLOW.indexOf(stage);
                    const nextStageLabel = nextStageIndex < CH_FLOW.length - 1 ? CH_FLOW[nextStageIndex + 1] : 'Concluir';

                    return (
                      <article key={p.id} className={`cdc ${isOverdue ? 'late' : ''}`}>
                        <div className="cdc-n">{p.nome}</div>
                        <div className="cdc-c">{p.chamado || 'Chamado não informado'}</div>
                        {p.proxima && <div className="cdc-m">{p.proxima}</div>}
                        <div className="cdc-m">{p.responsavel || 'Sem responsável'}</div>
                        {canWrite && (
                          <div className="cdc-a">
                            <button
                              type="button"
                              className="btn sm bisp"
                              onClick={() => handleAdvanceChamado(p.id)}
                            >
                              → {nextStageLabel}
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })
                ) : (
                  <div className="bempty">Ninguém nesta etapa</div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {currentView === 'desob' && (
        <section className="card" style={{ paddingBlock: 4 }}>
          {openDesob.length ? (
            <div className="list">
              {openDesob.map(p => {
                const curStep = Number(p.dpasso || 0);
                const nextStepLabel = curStep < D_FLOW.length - 1 ? `✓ ${D_FLOW[curStep]}` : '✓ Concluir no LCR';

                return (
                  <div key={p.id} className="row">
                    <div className="row-main">
                      <div className="row-t">{p.nome}</div>
                      <div className="row-m">
                        <span>{p.chamado || 'Chamado não informado'}</span>
                        {p.responsavel && <span>{p.responsavel}</span>}
                      </div>
                      <ol className="dsteps">
                        {D_FLOW.map((step, idx) => (
                          <li key={step} className={idx < curStep ? 'ok' : idx === curStep ? 'cur' : ''}>
                            {idx < curStep ? '✓ ' : ''}{step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {canWrite && (
                      <div className="acts">
                        <button
                          type="button"
                          className="btn sm"
                          onClick={() => handleAdvanceDesob(p.id)}
                        >
                          {nextStepLabel}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty" style={{ marginBlock: 12 }}>
              Nenhuma desobrigação pendente no momento.
            </div>
          )}
        </section>
      )}

      {currentView === 'feitos' && (
        <section className="card" style={{ paddingBlock: 4 }}>
          {concluidos.length ? (
            <div className="list">
              {concluidos.map(p => (
                <div key={p.id} className="row">
                  <div className="row-main">
                    <div className="row-t">{p.nome}</div>
                    <div className="row-m">
                      <span>{p.chamado || 'Chamado não informado'}</span>
                    </div>
                  </div>
                  <div className="acts">
                    <span className={`tag ${isDes(p) ? 'tag-warn' : 'tag-bispado'}`}>
                      {isDes(p) ? 'Desobrigação' : 'Chamado'}
                    </span>
                    {canWrite && (
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() => handleReopen(p.id)}
                      >
                        Reabrir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty" style={{ marginBlock: 12 }}>
              Nada concluído ainda.
            </div>
          )}
        </section>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal" onClick={() => setIsModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3>{modalTipo === 'chamado' ? 'Indicar chamado' : 'Nova desobrigação'}</h3>
            <form onSubmit={handleSubmit} className="form">
              <div className="field">
                <label>Nome *</label>
                <input
                  className="inp"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="field">
                <label>Chamado</label>
                <input
                  className="inp"
                  value={chamado}
                  onChange={e => setChamado(e.target.value)}
                  placeholder="Ex.: Professor da Escola Dominical"
                />
              </div>

              <div className="two">
                <div className="field">
                  <label>Responsável</label>
                  <input
                    className="inp"
                    value={responsavel}
                    onChange={e => setResponsavel(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Prazo</label>
                  <input
                    className="inp"
                    type="date"
                    value={prazo}
                    onChange={e => setPrazo(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label>Próxima ação</label>
                <input
                  className="inp"
                  value={proxima}
                  onChange={e => setProxima(e.target.value)}
                />
              </div>

              <div className="foot">
                <div className="btns">
                  <button type="submit" className="btn pri">
                    Salvar
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setIsModalOpen(false)}>
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
