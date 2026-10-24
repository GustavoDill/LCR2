import React from 'react';
import { Ata } from '../../types';
import { MEET_INFO } from './reuniaoConstants';

interface ReuniaoHeaderProps {
  activeMeeting: Ata;
  timerText: string;
  doneCount: number;
  pautaLength: number;
  progressPct: number;
  canWrite: boolean;
  onNoteChange: (key: string, value: string) => void;
}

export const ReuniaoHeader: React.FC<ReuniaoHeaderProps> = ({
  activeMeeting,
  timerText,
  doneCount,
  pautaLength,
  progressPct,
  canWrite,
  onNoteChange,
}) => {
  return (
    <>
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
          <span className="num">{doneCount} de {pautaLength} seções</span>
        </div>
      </div>

      <p className="q" style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 17, color: 'var(--muted)' }}>
        “{MEET_INFO[activeMeeting.tipo].q}”
      </p>

      {/* Sugestão 1: Card Devocional e Presenças da Reunião */}
      <div className="devocional-card">
        <div className="devocional-header">
          <div className="devocional-title-group">
            <div className="devocional-icon-badge" aria-hidden="true">
              🙏
            </div>
            <div className="devocional-titles">
              <h4>Devocional e Presença da Reunião</h4>
              <p>Registro de orações, mensagem espiritual e líderes presentes</p>
            </div>
          </div>
          <span className="devocional-badge-status">
            Salvo automaticamente
          </span>
        </div>

        <div className="devocional-grid">
          {/* Oração Inicial */}
          <div className="devocional-cell">
            <div className="devocional-cell-top">
              <label htmlFor="dev-oracao-ini" className="devocional-label" style={{ color: 'var(--bisp)' }}>
                <span>🙏</span> Oração Inicial
              </label>
              <span className="devocional-tag">Abertura</span>
            </div>
            <input
              id="dev-oracao-ini"
              className="devocional-input"
              placeholder="Quem ofereceu a oração inicial?"
              value={activeMeeting.notas?._oracaoAbertura || activeMeeting.oracaoAbertura || ''}
              onChange={e => onNoteChange('_oracaoAbertura', e.target.value)}
              readOnly={!canWrite}
            />
          </div>

          {/* Mensagem Espiritual */}
          <div className="devocional-cell">
            <div className="devocional-cell-top">
              <label htmlFor="dev-mensagem" className="devocional-label" style={{ color: activeMeeting.tipo === 'bispado' ? 'var(--bisp)' : 'var(--cons)' }}>
                <span>📖</span> Mensagem Espiritual
              </label>
              <span className="devocional-tag">Tema / Escritura</span>
            </div>
            <input
              id="dev-mensagem"
              className="devocional-input"
              placeholder="Tema, escritura ou orador..."
              value={activeMeeting.notas?._pensamentoEspiritual || activeMeeting.pensamentoEspiritual || ''}
              onChange={e => onNoteChange('_pensamentoEspiritual', e.target.value)}
              readOnly={!canWrite}
            />
          </div>

          {/* Oração Final */}
          <div className="devocional-cell">
            <div className="devocional-cell-top">
              <label htmlFor="dev-oracao-fim" className="devocional-label" style={{ color: 'var(--cons)' }}>
                <span>✨</span> Oração Final
              </label>
              <span className="devocional-tag">Encerramento</span>
            </div>
            <input
              id="dev-oracao-fim"
              className="devocional-input"
              placeholder="Quem fará a oração final?"
              value={activeMeeting.notas?._oracaoEncerramento || activeMeeting.oracaoEncerramento || ''}
              onChange={e => onNoteChange('_oracaoEncerramento', e.target.value)}
              readOnly={!canWrite}
            />
          </div>
        </div>

        {/* Presentes */}
        <div className="devocional-presentes">
          <label htmlFor="dev-presentes" className="lbl" style={{ marginBottom: 4, display: 'block' }}>
            Líderes Presentes
          </label>
          <input
            id="dev-presentes"
            className="inp"
            placeholder="Ex.: Bispo, 1º Conselheiro, Secretário Executivo, Pres. Sociedade de Socorro..."
            value={activeMeeting.notas?._pres || ''}
            onChange={e => onNoteChange('_pres', e.target.value)}
            readOnly={!canWrite}
          />
        </div>
      </div>
    </>
  );
};
