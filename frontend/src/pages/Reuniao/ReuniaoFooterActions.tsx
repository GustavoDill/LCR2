import React from 'react';

interface ReuniaoFooterActionsProps {
  confirmModal: 'end' | 'discard' | null;
  setConfirmModal: (v: 'end' | 'discard' | null) => void;
  canWrite: boolean;
  onEndMeeting: () => void;
  onDiscardMeeting: () => void;
  onExitActiveMeeting: () => void;
}

export const ReuniaoFooterActions: React.FC<ReuniaoFooterActionsProps> = ({
  confirmModal,
  setConfirmModal,
  canWrite,
  onEndMeeting,
  onDiscardMeeting,
  onExitActiveMeeting,
}) => {
  if (confirmModal === 'end') {
    return (
      <div className="confirm">
        <span>Encerrar e salvar a ata? Ela continuará disponível na aba Atas.</span>
        <div className="btns">
          <button type="button" className="btn pri" onClick={onEndMeeting}>
            Encerrar e salvar
          </button>
          <button type="button" className="btn ghost" onClick={() => setConfirmModal(null)}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (confirmModal === 'discard') {
    return (
      <div className="confirm">
        <span>Descartar esta reunião e todas as anotações? Esta ação não pode ser desfeita.</span>
        <div className="btns">
          <button type="button" className="btn danger" onClick={onDiscardMeeting}>
            Descartar
          </button>
          <button type="button" className="btn ghost" onClick={() => setConfirmModal(null)}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="btns" style={{ justifyContent: 'space-between' }}>
      <div className="btns">
        {canWrite && (
          <button type="button" className="btn pri" onClick={() => setConfirmModal('end')}>
            Encerrar e salvar ata
          </button>
        )}
        <button type="button" className="btn" onClick={onExitActiveMeeting}>
          Outras reuniões
        </button>
      </div>
      {canWrite && (
        <button type="button" className="btn ghost" onClick={() => setConfirmModal('discard')}>
          Descartar
        </button>
      )}
    </div>
  );
};
