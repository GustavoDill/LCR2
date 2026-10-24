import React from 'react';
import { Pessoa } from '../../types';
import { CH_FLOW } from './chamadosDesobrigacoesConstants';

interface ChamadosDesobrigacoesPipelineListProps {
  openChamados: Pessoa[];
  today: string;
  canWrite: boolean;
  onAdvance: (id: string) => void;
  onCancel: (id: string, nome?: string, isDesob?: boolean) => void;
}

export const ChamadosDesobrigacoesPipelineList: React.FC<ChamadosDesobrigacoesPipelineListProps> = ({
  openChamados,
  today,
  canWrite,
  onAdvance,
  onCancel,
}) => {
  return (
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
                const nextStageLabel = nextStageIndex < CH_FLOW.length - 1 ? CH_FLOW[nextStageIndex + 1] : 'Concluir chamado';

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
                          onClick={() => onAdvance(p.id)}
                        >
                          → {nextStageLabel}
                        </button>
                        <button
                          type="button"
                          className="btn ghost sm danger"
                          onClick={() => onCancel(p.id, p.nome, false)}
                          title="Cancelar chamado"
                        >
                          Cancelar
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
  );
};
