import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Designacao, AgendaEvento, Ata, Pessoa } from '../types';

export const Inicio: React.FC = () => {
  const { isBishopric, canWrite } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    openTasksCount: number;
    lateTasksCount: number;
    events30Count: number;
    events7Count: number;
    events7: AgendaEvento[];
    attentionTasks: Designacao[];
    liveMeetings: Ata[];
    lastAta: Ata | null;
    pendingAtividadesCount: number;
    chamados: {
      flowCount: number;
      desobrigacoesCount: number;
      lateCount: number;
      pipelineCounts: Record<string, number>;
      items: Pessoa[];
    } | null;
    pessoasAcompanhamentoCount: number | null;
    pessoasVencidasCount: number | null;
  } | null>(null);

  useEffect(() => {
    loadSummary();
  }, [isBishopric]);

  async function loadSummary() {
    try {
      const res = await api.get('/dashboard/resumo');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function advanceChamado(id: string) {
    try {
      await api.post(`/pessoas/${id}/advance-chamado`);
      loadSummary();
    } catch (err) {
      alert('Erro ao avançar etapa do chamado');
    }
  }

  async function startMeeting(tipo: 'bispado' | 'conselho') {
    try {
      const res = await api.post('/reunioes/start', { tipo });
      navigate('/reuniao', { state: { meetingId: res.id } });
    } catch (err: any) {
      alert(err.message || 'Erro ao iniciar reunião');
    }
  }

  if (loading) {
    return <div className="empty">Carregando visão geral da ala…</div>;
  }

  if (!data) {
    return <div className="empty">Não foi possível carregar os dados. Verifique a conexão com o servidor.</div>;
  }

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h2>Visão geral</h2>
          <p className="sub">Resumo da semana da Ala Bosque.</p>
        </div>
      </div>

      {isBishopric && data.pendingAtividadesCount > 0 && (
        <div className="alert a-crit" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span>
            <b>{data.pendingAtividadesCount} atividade{data.pendingAtividadesCount > 1 ? 's' : ''} aguardando aprovação</b> · enviada{data.pendingAtividadesCount > 1 ? 's' : ''} pelas organizações
          </span>
          <button type="button" className="btn sm" onClick={() => navigate('/atividades')}>
            Ver atividades
          </button>
        </div>
      )}

      {data.liveMeetings.map(m => (
        <div key={m.id} className={`notice ${m.tipo === 'bispado' ? 'bisp' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span>
            <b>{m.tipo === 'bispado' ? 'Reunião de Bispado' : 'Conselho da Ala'}</b> em andamento · {m.data}
          </span>
          <button
            type="button"
            className={`btn ${m.tipo === 'bispado' ? 'bisp' : 'cons'} sm`}
            onClick={() => navigate('/reuniao', { state: { meetingId: m.id } })}
          >
            Abrir reunião
          </button>
        </div>
      ))}

      <div className="stats">
        <div className="stat">
          <div className="v num">{data.openTasksCount}</div>
          <div className="l">designações abertas</div>
          <div className={`x ${data.lateTasksCount ? 'crit' : 'ok'}`}>
            {data.lateTasksCount ? `${data.lateTasksCount} atrasada${data.lateTasksCount > 1 ? 's' : ''}` : 'nenhuma atrasada'}
          </div>
        </div>

        <div className="stat">
          <div className="v num">{data.events30Count}</div>
          <div className="l">eventos nos próximos 30 dias</div>
          <div className="x">{data.events7Count} nesta semana</div>
        </div>

        {isBishopric && (
          <div className="stat">
            <div className="v num">{data.pessoasAcompanhamentoCount || 0}</div>
            <div className="l">pessoas em acompanhamento</div>
            <div className="x">
              {data.pessoasVencidasCount ? `${data.pessoasVencidasCount} com ação vencida` : 'todas em dia'}
            </div>
          </div>
        )}

        <div className="stat">
          <div className="v" style={{ fontSize: 22, paddingBlock: 4 }}>
            {data.lastAta ? data.lastAta.data : '—'}
          </div>
          <div className="l">última ata registrada</div>
          <div className="x">
            {data.lastAta ? (data.lastAta.tipo === 'bispado' ? 'Reunião de Bispado' : 'Conselho da Ala') : 'nenhuma ainda'}
          </div>
        </div>
      </div>

      {isBishopric && data.chamados && (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="head">
            <div>
              <h3 style={{ margin: 0 }}>Chamados novos</h3>
              <p className="sub" style={{ fontSize: 13 }}>
                Da indicação até a designação. Toque numa etapa para filtrar ou avançar.
              </p>
            </div>
            <div className="btns">
              <button type="button" className="btn bisp sm" onClick={() => navigate('/chamdes')}>
                Abrir pipeline completo
              </button>
            </div>
          </div>

          <div className="pipe">
            {['Indicado', 'Aprovação do bispado', 'Entrevista', 'Apoio na sacramental', 'Designação'].map((stage, idx) => {
              const count = data.chamados?.pipelineCounts[stage] || 0;
              return (
                <div key={stage} className={`pipe-s ${count ? 'has' : ''}`} onClick={() => navigate('/chamdes')}>
                  <span className="n">{count}</span>
                  <span className="t">{stage}</span>
                </div>
              );
            })}
          </div>

          <div className="kpis">
            <span><b>{data.chamados.flowCount}</b> em andamento</span>
            <span><b>{data.chamados.desobrigacoesCount}</b> desobrigações</span>
            <span className={data.chamados.lateCount ? 'crit' : ''}>
              <b>{data.chamados.lateCount}</b> com ação vencida
            </span>
          </div>

          {data.chamados.items.length > 0 ? (
            <div className="list">
              {data.chamados.items.slice(0, 5).map(p => (
                <div key={p.id} className="row">
                  <div className="row-main">
                    <div className="row-t">{p.nome}</div>
                    <div className="row-m">
                      <span>{p.chamado || 'Chamado não informado'}</span>
                      {p.proxima && <span>{p.proxima}</span>}
                      {p.responsavel && <span>{p.responsavel}</span>}
                    </div>
                  </div>
                  <div className="acts">
                    <span className="tag tag-bispado">{p.detalhe || 'Indicado'}</span>
                    <button
                      type="button"
                      className="btn sm bisp"
                      onClick={() => advanceChamado(p.id)}
                    >
                      Avançar etapa →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">Nenhum chamado pendente no momento.</div>
          )}
        </section>
      )}

      <div className="grid2">
        <section className="card">
          <div className="head" style={{ marginBottom: 6 }}>
            <h3 style={{ margin: 0 }}>Precisa de atenção</h3>
            <button type="button" className="btn ghost sm" onClick={() => navigate('/designacoes')}>
              Ver todas
            </button>
          </div>
          {data.attentionTasks.length > 0 ? (
            <div className="list">
              {data.attentionTasks.slice(0, 6).map(d => (
                <div key={d.id} className="row">
                  <div className="row-main">
                    <div className="row-t">{d.titulo}</div>
                    <div className="row-m">
                      <span>{d.responsavel || 'Sem responsável'}</span>
                      <span className={d.prazo && d.prazo < new Date().toISOString().split('T')[0] ? 'late-txt' : ''}>
                        {d.prazo ? `Prazo: ${d.prazo}` : 'Sem prazo'}
                      </span>
                    </div>
                  </div>
                  <span className={`tag tag-${d.origem}`}>{d.origem === 'bispado' ? 'Bispado' : 'Conselho'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">Nenhuma designação atrasada ou vencendo nos próximos 7 dias.</div>
          )}
        </section>

        <section className="card">
          <div className="head" style={{ marginBottom: 6 }}>
            <h3 style={{ margin: 0 }}>Próximos 7 dias</h3>
            <button type="button" className="btn ghost sm" onClick={() => navigate('/agenda')}>
              Agenda
            </button>
          </div>
          {data.events7.length > 0 ? (
            <div className="list">
              {data.events7.map(e => (
                <div key={e.id} className="row">
                  <div className="row-main">
                    <div className="row-t">{e.titulo}</div>
                    <div className="row-m">
                      <span>{e.data}</span>
                      <span>{e.org}</span>
                      {e.responsavel && <span>{e.responsavel}</span>}
                    </div>
                  </div>
                  {e.proposito && <span className="tag tag-soft">{e.proposito}</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">Nenhum evento agendado para os próximos 7 dias.</div>
          )}
        </section>
      </div>

      <div className="grid2">
        {isBishopric && (
          <div className="mt bispado">
            <span className="tag tag-bispado" style={{ alignSelf: 'flex-start' }}>Liderança</span>
            <h3>Reunião de Bispado</h3>
            <p className="q">“O que precisamos decidir, resolver ou acompanhar como liderança?”</p>
            <p className="who">Bispo, 1º e 2º conselheiros, secretário da ala e secretário executivo · 60 min</p>
            <div className="btns">
              {canWrite && (
                <button type="button" className="btn bisp" onClick={() => startMeeting('bispado')}>
                  Iniciar reunião de bispado
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt conselho">
          <span className="tag tag-conselho" style={{ alignSelf: 'flex-start' }}>Ação conjunta</span>
          <h3>Conselho da Ala</h3>
          <p className="q">“O que precisamos fazer juntos para abençoar os membros?”</p>
          <p className="who">Bispado, secretários e presidentes do Quórum de Élderes, Sociedade de Socorro, Moças, Primária e Escola Dominical</p>
          <div className="btns">
            {canWrite && (
              <button type="button" className="btn cons" onClick={() => startMeeting('conselho')}>
                Iniciar conselho da ala
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
