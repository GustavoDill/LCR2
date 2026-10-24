import React, { useEffect, useState } from 'react';
import { MuralData, MuralDiscursanteDom } from '../../types';
import { MuralPoster } from './MuralPoster';

interface MuralZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  mural: MuralData;
  posterHeight: number;
  logoBosqueSagrado: string;
  discursantesPairs: MuralDiscursanteDom[][];
  hasFiveSundays: boolean;
  modalPosterRef: React.Ref<HTMLDivElement>;
  onDownloadPng: () => void;
  exporting: boolean;
}

export const MuralZoomModal: React.FC<MuralZoomModalProps> = ({
  isOpen,
  onClose,
  mural,
  posterHeight,
  logoBosqueSagrado,
  discursantesPairs,
  hasFiveSundays,
  modalPosterRef,
  onDownloadPng,
  exporting,
}) => {
  const [modalZoom, setModalZoom] = useState(1.0);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="mural-modal-backdrop"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mural-modal-dialog" role="dialog" aria-modal="true">
        <div className="mural-modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
              Visualização Ampliada do Cartaz
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Ala Bosque Sagrado • Domingo {mural.dataTopo}
            </span>
          </div>

          <div className="mural-modal-controls">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                Zoom:
              </span>
              <button
                type="button"
                className="btn btn-secondary sm"
                onClick={() => setModalZoom(z => Math.max(0.6, Math.round((z - 0.15) * 100) / 100))}
                disabled={modalZoom <= 0.6}
                title="Diminuir Zoom"
                style={{ padding: '2px 8px', minWidth: 28 }}
              >
                −
              </button>
              <span
                style={{
                  fontSize: '0.85rem',
                  minWidth: 44,
                  textAlign: 'center',
                  fontWeight: 800,
                }}
              >
                {Math.round(modalZoom * 100)}%
              </span>
              <button
                type="button"
                className="btn btn-secondary sm"
                onClick={() => setModalZoom(z => Math.min(1.6, Math.round((z + 0.15) * 100) / 100))}
                disabled={modalZoom >= 1.6}
                title="Aumentar Zoom"
                style={{ padding: '2px 8px', minWidth: 28 }}
              >
                +
              </button>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => setModalZoom(1.0)}
                title="Restaurar zoom para 100%"
                style={{ fontSize: '0.78rem', padding: '2px 8px' }}
              >
                100%
              </button>
            </div>

            <button
              type="button"
              className="btn pri sm"
              onClick={onDownloadPng}
              disabled={exporting}
            >
              {exporting ? 'Gerando…' : '⬇️ Baixar PNG'}
            </button>

            <button
              type="button"
              className="btn ghost sm"
              onClick={onClose}
              aria-label="Fechar"
              title="Fechar (Esc)"
              style={{ fontSize: '1.2rem', padding: '2px 8px', lineHeight: 1 }}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="mural-modal-body">
          <div
            style={{
              width: Math.round(540 * modalZoom),
              height: Math.round(posterHeight * modalZoom),
              position: 'relative',
              flexShrink: 0,
              transition: 'width 0.15s ease, height 0.15s ease',
            }}
          >
            <MuralPoster
              mural={mural}
              logoBosqueSagrado={logoBosqueSagrado}
              discursantesPairs={discursantesPairs}
              hasFiveSundays={hasFiveSundays}
              posterRef={modalPosterRef}
              scale={modalZoom}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
