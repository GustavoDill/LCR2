import React from 'react';
import { Designacao, MeetingType, Pessoa } from '../../types';
import { MeetingSection } from './reuniaoConstants';

interface ReuniaoSectionItemProps {
  sec: MeetingSection;
  isOpen: boolean;
  isDone: boolean;
  noteText: string;
  meetingTipo: MeetingType;
  canWrite: boolean;
  liveDesignacoes: Designacao[];
  livePessoas: Pessoa[];
  vagasCount: number;
  onToggleSection: (secKey: string) => void;
  onNoteChange: (secKey: string, value: string) => void;
  onTratadoToggle: (secKey: string, checked: boolean) => void;
  onOpenCreateTaskModal: (secKey: string) => void;
  onCycleTask: (taskId: string, origem: 'bispado' | 'conselho') => void;
  onAdvanceChamado: (pessoaId: string) => void;
}

export const ReuniaoSectionItem: React.FC<ReuniaoSectionItemProps> = ({
  sec,
  isOpen,
  isDone,
  noteText,
  meetingTipo,
  canWrite,
  liveDesignacoes,
  livePessoas,
  vagasCount,
  onToggleSection,
  onNoteChange,
  onTratadoToggle,
  onOpenCreateTaskModal,
  onCycleTask,
  onAdvanceChamado,
}) => {
  return (
    <section className={`sec ${isOpen ? 'open' : ''} ${isDone ? 'done' : ''}`}>
      <button
        type="button"
        className="sec-h"
        onClick={() => onToggleSection(sec.k)}
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

          {/* WIDGET DINÂMICO 1: Designações Anteriores (Seção B do Bispado ou 2 do Conselho) */}
          {(sec.k === 'B' || sec.k === '2') && (
            <div className="embed" style={{ marginTop: '8px' }}>
              <div className="embed-h">
                <span>📋 Designações em Aberto na Ala</span>
                {canWrite && (
                  <button
                    type="button"
                    className="btn sm"
                    style={{ padding: '2px 8px', fontSize: '11px' }}
                    onClick={() => onOpenCreateTaskModal(sec.k)}
                  >
                    + Nova designação
                  </button>
                )}
              </div>

              {liveDesignacoes.filter(d => d.status !== 'concluida' && (meetingTipo === 'bispado' || d.origem === 'conselho')).length === 0 ? (
                <div style={{ fontSize: '12px', color: '#10b981', padding: '6px 0' }}>
                  ✨ Todas as designações anteriores estão em dia!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {liveDesignacoes
                    .filter(d => d.status !== 'concluida' && (meetingTipo === 'bispado' || d.origem === 'conselho'))
                    .slice(0, 8)
                    .map(t => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const late = t.prazo && t.prazo < todayStr;
                      return (
                        <div
                          key={t.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '6px 10px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                          }}
                        >
                          <button
                            type="button"
                            className={`st st-${t.status || 'pendente'}`}
                            style={{ fontSize: '11px', padding: '2px 8px' }}
                            onClick={() => onCycleTask(t.id, t.origem)}
                            disabled={!canWrite}
                            title="Tocar para mudar a situação"
                          >
                            {t.status === 'andamento' ? 'Andamento' : t.status === 'concluida' ? 'Concluída' : 'Pendente'}
                          </button>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 500 }}>{t.titulo}</div>
                            <div style={{ fontSize: '11.5px', color: '#94a3b8', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <span>👤 {t.responsavel || 'Sem responsável'}</span>
                              <span style={{ color: late ? '#f43f5e' : 'inherit' }}>
                                📅 {t.prazo || 'Sem prazo'} {late ? '· Atrasada' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* WIDGET DINÂMICO 2: Chamados da Ala em Pipeline (Seção F do Bispado) */}
          {sec.k === 'F' && (
            <div className="embed" style={{ marginTop: '8px' }}>
              <div className="embed-h">
                <span>👑 Pipeline de Chamados ({livePessoas.filter(p => p.tipo === 'chamado' && p.status === 'aberto').length} em andamento)</span>
                <span style={{ color: vagasCount ? '#f43f5e' : '#10b981', fontSize: '11px' }}>
                  {vagasCount} vaga{vagasCount === 1 ? '' : 's'} aberta{vagasCount === 1 ? '' : 's'} na ala
                </span>
              </div>

              {livePessoas.filter(p => p.tipo === 'chamado' && p.status === 'aberto').length === 0 ? (
                <div style={{ fontSize: '12px', color: '#94a3b8', padding: '6px 0' }}>
                  Nenhum processo de indicação pendente nesta semana.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  {livePessoas
                    .filter(p => p.tipo === 'chamado' && p.status === 'aberto')
                    .map(cp => (
                      <div
                        key={cp.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          background: 'rgba(56, 189, 248, 0.05)',
                          border: '1px solid rgba(56, 189, 248, 0.2)',
                          borderRadius: '8px',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc' }}>
                            {cp.nome} <span style={{ color: '#38bdf8', fontWeight: 400 }}>— {cp.chamado}</span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                            Etapa atual: <b style={{ color: '#e2e8f0' }}>{cp.detalhe || 'Indicado'}</b>
                            {cp.proxima && ` · Próximo: ${cp.proxima}`}
                          </div>
                        </div>

                        {canWrite && (
                          <button
                            type="button"
                            className="btn sm"
                            style={{ fontSize: '11.5px', padding: '4px 10px', whiteSpace: 'nowrap' }}
                            onClick={() => onAdvanceChamado(cp.id)}
                          >
                            Aprovar / Avançar
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* WIDGET DINÂMICO 3: Pessoas e Famílias em Acompanhamento (Seção C do Bispado) */}
          {sec.k === 'C' && livePessoas.filter(p => p.tipo === 'acomp' && p.status === 'aberto').length > 0 && (
            <div className="embed" style={{ marginTop: '8px' }}>
              <div className="embed-h">
                <span>🤝 Pessoas em Acompanhamento Espiritual</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {livePessoas
                  .filter(p => p.tipo === 'acomp' && p.status === 'aberto')
                  .map(ap => (
                    <span
                      key={ap.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#e2e8f0',
                      }}
                    >
                      👤 {ap.nome} {ap.detalhe ? `(${ap.detalhe})` : ''}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* WIDGET DINÂMICO 4: Ordenanças em Preparação (Seção E do Bispado) */}
          {sec.k === 'E' && livePessoas.filter(p => p.tipo === 'ordenanca' && p.status === 'aberto').length > 0 && (
            <div className="embed" style={{ marginTop: '8px' }}>
              <div className="embed-h">
                <span>🕊️ Preparação para Ordenanças</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {livePessoas
                  .filter(p => p.tipo === 'ordenanca' && p.status === 'aberto')
                  .map(op => (
                    <span
                      key={op.id}
                      style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#34d399',
                      }}
                    >
                      ✨ {op.nome} {op.detalhe ? `· ${op.detalhe}` : ''}
                    </span>
                  ))}
              </div>
            </div>
          )}

          <div className="field">
            <label>Anotações</label>
            <textarea
              className="inp"
              placeholder={canWrite ? 'Decisões, impressões e próximos passos' : 'Sem anotações ainda'}
              value={noteText}
              onChange={e => onNoteChange(sec.k, e.target.value)}
              readOnly={!canWrite}
            />
          </div>

          <div className="sec-f">
            {canWrite ? (
              <button
                type="button"
                className="btn sm"
                onClick={() => onOpenCreateTaskModal(sec.k)}
                title="Criar designação diretamente nesta reunião"
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
                onChange={e => onTratadoToggle(sec.k, e.target.checked)}
                disabled={!canWrite}
              />
              Seção tratada
            </label>
          </div>
        </div>
      )}
    </section>
  );
};
