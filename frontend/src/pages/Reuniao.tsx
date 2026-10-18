import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Ata, MeetingType } from '../types';

export const MEET_INFO = {
  bispado: {
    l: 'Reunião de Bispado',
    q: 'O que precisamos decidir, resolver ou acompanhar como liderança?',
    who: 'Bispo, 1º e 2º conselheiros, secretário da ala e secretário executivo',
  },
  conselho: {
    l: 'Conselho da Ala',
    q: 'O que precisamos fazer juntos para abençoar os membros?',
    who: 'Bispado, secretários e presidentes do Quórum de Élderes, Sociedade de Socorro, Moças, Primária e Escola Dominical',
  },
};

interface MeetingSection {
  k: string;
  t: string;
  min: number;
  q?: string;
  warn?: string;
  items?: string[];
  questions?: string[];
  groups?: Array<{ g: string; i: string[] }>;
}

export const PAUTA: Record<'bispado' | 'conselho', MeetingSection[]> = {
  bispado: [
    { k: 'A', t: 'Abertura espiritual', min: 5, items: ['Oração', 'Estudo breve das escrituras', 'Impressões e revelação recebidas', 'Prioridades espirituais da semana'] },
    { k: 'B', t: 'Designações anteriores', min: 5, q: 'Nenhuma reunião termina sem deixar claro quem fará o quê e até quando.' },
    { k: 'C', t: 'Pessoas e famílias', min: 10, items: ['Famílias que precisam de apoio', 'Membros afastados', 'Membros novos e conversos recentes', 'Jovens que precisam de acompanhamento', 'Crianças que precisam de atenção', 'Membros retornando à atividade', 'Situações que exigem o bispo', 'Famílias que precisam de fortalecimento espiritual'], warn: 'Assuntos pessoais e confidenciais ficam no bispado e não vão ao Conselho da Ala sem necessidade.' },
    { k: 'D', t: 'Jovens', min: 6, groups: [{ g: 'Rapazes', i: ['Diáconos', 'Mestres', 'Sacerdotes', 'Frequência e participação', 'Progresso no sacerdócio', 'Preparação para o Sacerdócio de Melquisedeque', 'Entrevistas', 'Futuros missionários'] }, { g: 'Moças', i: ['Frequência e participação', 'Classes', 'Progresso', 'Entrevistas', 'Necessidades individuais', 'Preparação espiritual'] }, { g: 'Eventos', i: ['Acampamentos', 'FSY', 'Conferências', 'Atividades'] }] },
    { k: 'E', t: 'Ordenanças e progresso', min: 4, items: ['Batismo e confirmação', 'Sacerdócio Aarônico', 'Sacerdócio de Melquisedeque', 'Investidura', 'Selamento', 'Recomendações para o templo', 'Batismos vicários'] },
    { k: 'F', t: 'Chamados da ala', min: 5, groups: [{ g: 'Chamados existentes', i: ['Quem precisa ser desobrigado?', 'Quem precisa de apoio?', 'Algum chamado sem funcionamento?', 'Alguma organização precisa de mais pessoas?'] }, { g: 'Novos chamados', i: ['Possíveis nomes', 'Aprovação do bispado', 'Entrevistas', 'Apoios', 'Designações'] }] },
    { k: 'G', t: 'Trabalho missionário', min: 4, items: ['Missionários de tempo integral', 'Pessoas sendo ensinadas', 'Amigos da Igreja', 'Batismos previstos', 'Missionários retornados', 'Jovens preparando-se para a missão', 'Necessidades dos missionários'] },
    { k: 'H', t: 'Templo e história da família', min: 3, items: ['Recomendações a renovar', 'Jovens preparando-se para o templo', 'Batismos vicários', 'Viagens ao templo', 'Curso de preparação para o templo', 'Plano de templo e história da família da ala'] },
    { k: 'I', t: 'Necessidades temporais', min: 3, items: ['Alimentação', 'Moradia', 'Emprego', 'Transporte', 'Emergências', 'Fundo de jejum', 'Autossuficiência', 'Encaminhamentos'], warn: 'Tratar com total confidencialidade.' },
    { k: 'J', t: 'Finanças da ala', min: 3, items: ['Orçamento e saldo', 'Gastos realizados', 'Próximas despesas', 'Aprovação de despesas', 'Necessidades das organizações', 'Prestação de contas'] },
    { k: 'K', t: 'Registros e administração', min: 2, items: ['Relatórios e frequência', 'Registros de membros', 'Mudanças de endereço e transferências', 'Crianças chegando à idade de ordenanças', 'Pendências administrativas'] },
    { k: 'L', t: 'Reuniões e calendário', min: 3, items: ['Reunião sacramental', 'Conselho da Ala', 'Conselho de Jovens', 'Atividades e conferências', 'Visitas da presidência da estaca', 'Batismos e ordenanças'] },
    { k: 'M', t: 'Treinamento dos líderes', min: 2, q: 'Qual líder ou organização precisa de mais apoio do bispado esta semana?', items: ['Presidentes de quórum', 'Sociedade de Socorro', 'Moças', 'Primária', 'Escola Dominical', 'Secretários', 'Líderes missionários e de templo'] },
    { k: 'N', t: 'Instruções da Igreja', min: 2, items: ['Manual Geral', 'Escrituras', 'Cartas da Primeira Presidência', 'Presidência de Área', 'Presidência da Estaca', 'Treinamentos recentes'] },
    { k: 'O', t: 'Planejamento das próximas semanas', min: 3, questions: ['O que acontecerá nos próximos 7 dias?', 'O que acontecerá nos próximos 30 dias?', 'Que risco ou problema precisamos antecipar?', 'Qual é a maior prioridade espiritual da ala agora?'] },
  ],
  conselho: [
    { k: '1', t: 'Abertura', min: 3, items: ['Oração', 'Mensagem', 'Propósito da reunião'] },
    { k: '2', t: 'Designações anteriores', min: 5, questions: ['O que foi feito?', 'O que não foi feito, e por quê?', 'Quem continua responsável?'] },
    { k: '3', t: 'Situação espiritual da ala', min: 6, q: 'Quem precisa de nós?', items: ['Frequência e participação', 'Membros afastados', 'Novos membros e conversos', 'Famílias que precisam de apoio', 'Jovens', 'Crianças', 'Idosos', 'Pessoas que precisam de integração'] },
    { k: '4', t: 'Fortalecimento dos membros', min: 8, groups: [{ g: 'Quórum de Élderes', i: ['Homens', 'Famílias', 'Ministração', 'Necessidades temporais', 'Sacerdócio'] }, { g: 'Sociedade de Socorro', i: ['Mulheres', 'Famílias', 'Ministração', 'Necessidades', 'Fortalecimento espiritual'] }, { g: 'Moças', i: ['Jovens', 'Integração', 'Participação', 'Atividades'] }, { g: 'Primária', i: ['Crianças', 'Famílias', 'Frequência', 'Transição para os jovens'] }, { g: 'Escola Dominical', i: ['Professores', 'Qualidade das aulas', 'Participação', 'Treinamento'] }] },
    { k: '5', t: 'Trabalho missionário', min: 5, questions: ['Quem podemos convidar?', 'Quem está sendo ensinado?', 'Quem precisa de um amigo?', 'Quem precisa retornar à Igreja?', 'Quais famílias podem ajudar?', 'Que atividades servem para integração?'] },
    { k: '6', t: 'Templo e história da família', min: 4, items: ['Quem pode ir ao templo?', 'Jovens e batismos vicários', 'Famílias', 'Preparação para o templo', 'Atividades de história da família'] },
    { k: '7', t: 'Jovens', min: 5, items: ['Frequência e participação', 'Atividades, FSY e acampamentos', 'Seminário', 'Preparação missionária', 'Preparação para o templo', 'Jovens que precisam de integração', 'Jovens que precisam de um líder ou mentor'] },
    { k: '8', t: 'Crianças', min: 3, items: ['Frequência', 'Professores', 'Necessidades especiais', 'Transição para Moças e Quórum', 'Proteção e segurança'] },
    { k: '9', t: 'Ministração', min: 5, items: ['Famílias sem contato', 'Necessidades identificadas', 'Designações de ministração', 'Casos que precisam de apoio', 'Integração entre organizações'] },
    { k: '10', t: 'Autossuficiência e necessidades temporais', min: 3, items: ['Emprego', 'Educação', 'Alimentação', 'Moradia', 'Finanças familiares', 'Emergências', 'Recursos da Igreja'] },
    { k: '11', t: 'Atividades da ala', min: 3, q: 'Qual é o propósito desta atividade?', items: ['Fortalecimento espiritual', 'Integração', 'Missionário', 'Família', 'Jovens', 'Crianças', 'Templo', 'Serviço', 'Autossuficiência'] },
    { k: '12', t: 'Frequência e retenção', min: 3, items: ['Aumentar participação', 'Recuperar membros', 'Integrar novos membros', 'Evitar que pessoas se afastem'] },
    { k: '13', t: 'Ensino do evangelho', min: 2, items: ['Professores', 'Necessidades de treinamento', 'Qualidade do ensino', 'Participação dos alunos'] },
    { k: '14', t: 'Calendário e prioridades', min: 3, items: ['Conflitos de calendário', 'Recursos e transporte', 'Responsáveis', 'Comunicação e divulgação'] },
    { k: '15', t: 'Metas da ala', min: 2, items: ['Acompanhamento das metas estabelecidas'] },
  ],
};

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

  // Auto-save debounce tracker
  const debounceTimers = useRef<Record<string, any>>({});

  useEffect(() => {
    loadOpenMeetings();
  }, [location.state]);

  async function loadOpenMeetings() {
    try {
      const atas = await api.get<Ata[]>('/atas');
      const live = atas.filter(a => a.status === 'aberta');

      const targetId = (location.state as any)?.meetingId;
      if (targetId) {
        const found = live.find(m => m.id === targetId);
        if (found) {
          setActiveMeeting(found);
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
      <div className="stack">
        <div className="head">
          <div>
            <h2>Reunião</h2>
            <p className="sub">
              Escolha a reunião, siga a pauta e registre as anotações. Quem tiver acesso acompanha ao vivo, e a ata fica salva ao encerrar.
            </p>
          </div>
        </div>

        {canWrite && (
          <div className="field" style={{ maxWidth: 220 }}>
            <label>Data da reunião</label>
            <input
              className="inp"
              type="date"
              value={meetingDate}
              onChange={e => setMeetingDate(e.target.value)}
            />
          </div>
        )}

        <div className="grid2">
          {isBishopric && (
            <div className="mt bispado">
              <h3>Reunião de Bispado</h3>
              <p className="q">“O que precisamos decidir, resolver ou acompanhar como liderança?”</p>
              <p className="who">{MEET_INFO.bispado.who}</p>
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
            <h3>Conselho da Ala</h3>
            <p className="q">“O que precisamos fazer juntos para abençoar os membros?”</p>
            <p className="who">{MEET_INFO.conselho.who}</p>
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
  }

  // Active meeting view
  const pauta = PAUTA[activeMeeting.tipo];
  const tratados = activeMeeting.tratados || {};
  const doneCount = pauta.filter(s => tratados[s.k]).length;
  const progressPct = Math.round((doneCount / pauta.length) * 100);

  return (
    <div className={`stack mt-${activeMeeting.tipo}`}>
      <div className="mhead">
        <div className="ttl">
          <span className={`tag tag-${activeMeeting.tipo}`} style={{ alignSelf: 'flex-start' }}>
            {activeMeeting.tipo === 'bispado' ? 'Bispado' : 'Conselho'}
          </span>
          <h2>{MEET_INFO[activeMeeting.tipo].l}</h2>
          <div className="meta">
            <span>{activeMeeting.data}</span>
            <span className="clock">{timerText}</span>
            <span>de 60 min</span>
          </div>
        </div>

        <div className="meta" style={{ flex: 1, justifyContent: 'flex-end' }}>
          <div className="bar">
            <i style={{ width: `${progressPct}%` }} />
          </div>
          <span className="num">{doneCount} de {pauta.length} seções</span>
        </div>
      </div>

      <p className="q" style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 17, color: 'var(--muted)' }}>
        “{MEET_INFO[activeMeeting.tipo].q}”
      </p>

      <div className="field">
        <label>Presentes</label>
        <input
          className="inp"
          placeholder="Ex.: Bispo, 1º Conselheiro, Secretário Executivo"
          value={activeMeeting.notas?._pres || ''}
          onChange={e => handleNoteChange('_pres', e.target.value)}
          readOnly={!canWrite}
        />
      </div>

      <div className="pauta">
        {pauta.map(sec => {
          const isOpen = openSections.has(sec.k);
          const isDone = Boolean(tratados[sec.k]);
          const noteText = activeMeeting.notas?.[sec.k] || '';

          return (
            <section key={sec.k} className={`sec ${isOpen ? 'open' : ''} ${isDone ? 'done' : ''}`}>
              <button
                type="button"
                className="sec-h"
                onClick={() => toggleSection(sec.k)}
                aria-expanded={isOpen}
              >
                <span className="key">{sec.k}</span>
                <span className="sec-t">{sec.t}</span>
                {noteText.trim() && <span className="has-note" title="Tem anotações" />}
                <span className="sec-min">{sec.min} min</span>
                <span className="caret" aria-hidden="true" />
              </button>

              {isOpen && (
                <div className="sec-b">
                  {sec.q && <p className="quote">“{sec.q}”</p>}
                  {sec.warn && <p className="warnline">{sec.warn}</p>}

                  {sec.items && (
                    <ul className="prompts">
                      {sec.items.map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}

                  {sec.groups && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {sec.groups.map(grp => (
                        <div key={grp.g} className="grp">
                          <span className="lbl">{grp.g}</span>
                          <ul className="prompts">
                            {grp.i.map(i => (
                              <li key={i}>{i}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {sec.questions && (
                    <ol className="qs">
                      {sec.questions.map(q => (
                        <li key={q}>{q}</li>
                      ))}
                    </ol>
                  )}

                  <div className="field">
                    <label>Anotações</label>
                    <textarea
                      className="inp"
                      placeholder={canWrite ? 'Decisões, impressões e próximos passos' : 'Sem anotações ainda'}
                      value={noteText}
                      onChange={e => handleNoteChange(sec.k, e.target.value)}
                      readOnly={!canWrite}
                    />
                  </div>

                  <div className="sec-f">
                    {canWrite ? (
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => navigate('/designacoes', { state: { ataId: activeMeeting.id, origin: activeMeeting.tipo } })}
                      >
                        + Designação
                      </button>
                    ) : (
                      <span />
                    )}

                    <label className="chk">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={e => handleTratadoToggle(sec.k, e.target.checked)}
                        disabled={!canWrite}
                      />
                      Seção tratada
                    </label>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {confirmModal === 'end' ? (
        <div className="confirm">
          <span>Encerrar e salvar a ata? Ela continuará disponível na aba Atas.</span>
          <div className="btns">
            <button type="button" className="btn pri" onClick={endMeeting}>
              Encerrar e salvar
            </button>
            <button type="button" className="btn ghost" onClick={() => setConfirmModal(null)}>
              Voltar
            </button>
          </div>
        </div>
      ) : confirmModal === 'discard' ? (
        <div className="confirm">
          <span>Descartar esta reunião e todas as anotações? Esta ação não pode ser desfeita.</span>
          <div className="btns">
            <button type="button" className="btn danger" onClick={discardMeeting}>
              Descartar
            </button>
            <button type="button" className="btn ghost" onClick={() => setConfirmModal(null)}>
              Voltar
            </button>
          </div>
        </div>
      ) : (
        <div className="btns" style={{ justifyContent: 'space-between' }}>
          <div className="btns">
            {canWrite && (
              <button type="button" className="btn pri" onClick={() => setConfirmModal('end')}>
                Encerrar e salvar ata
              </button>
            )}
            <button type="button" className="btn" onClick={() => setActiveMeeting(null)}>
              Outras reuniões
            </button>
          </div>
          {canWrite && (
            <button type="button" className="btn ghost" onClick={() => setConfirmModal('discard')}>
              Descartar
            </button>
          )}
        </div>
      )}
    </div>
  );
};
