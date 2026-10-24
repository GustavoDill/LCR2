import React from 'react';
import { Pessoa } from '../../types';
import { D_FLOW } from './chamadosDesobrigacoesConstants';

interface ChamadosDesobrigacoesDesobListProps {
  openDesob: Pessoa[];
  canWrite: boolean;
  onAdvance: (id: string) => void;
  onCancel: (id: string, nome?: string, isDesob?: boolean) => void;
}

export const ChamadosDesobrigacoesDesobList: React.FC<ChamadosDesobrigacoesDesobListProps> = ({
  openDesob,
  canWrite,
  onAdvance,
  onCancel,
}) => {
  return (
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
                      onClick={() => onAdvance(p.id)}
                    >
                      {nextStepLabel}
                    </button>
                    <button
                      type="button"
                      className="btn ghost sm danger"
                      onClick={() => onCancel(p.id, p.nome, true)}
                      title="Cancelar desobrigação"
                    >
                      Cancelar
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
  );
};
