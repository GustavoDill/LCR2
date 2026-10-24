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

      <div className="field">
        <label>Presentes</label>
        <input
          className="inp"
          placeholder="Ex.: Bispo, 1º Conselheiro, Secretário Executivo"
          value={activeMeeting.notas?._pres || ''}
          onChange={e => onNoteChange('_pres', e.target.value)}
          readOnly={!canWrite}
        />
      </div>
    </>
  );
};
