import React from 'react';
import { MeetingType } from '../../types';
import { MEET_INFO } from './reuniaoConstants';

interface ReuniaoSelectionViewProps {
  meetingDate: string;
  setMeetingDate: (v: string) => void;
  canWrite: boolean;
  isBishopric: boolean;
  onStartMeeting: (tipo: MeetingType) => void;
}

export const ReuniaoSelectionView: React.FC<ReuniaoSelectionViewProps> = ({
  meetingDate,
  setMeetingDate,
  canWrite,
  isBishopric,
  onStartMeeting,
}) => {
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
                <button type="button" className="btn bisp" onClick={() => onStartMeeting('bispado')}>
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
              <button type="button" className="btn cons" onClick={() => onStartMeeting('conselho')}>
                Iniciar conselho da ala
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
