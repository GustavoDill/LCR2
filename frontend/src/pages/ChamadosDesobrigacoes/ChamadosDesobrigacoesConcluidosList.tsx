import React from 'react';
import { Pessoa } from '../../types';

interface ChamadosDesobrigacoesConcluidosListProps {
  concluidos: Pessoa[];
  canWrite: boolean;
  onReopen: (id: string) => void;
  onCancel: (id: string, nome?: string, isDesob?: boolean) => void;
}

export const ChamadosDesobrigacoesConcluidosList: React.FC<ChamadosDesobrigacoesConcluidosListProps> = ({
  concluidos,
  canWrite,
  onReopen,
  onCancel,
}) => {
  const isDes = (p: Pessoa) => p.detalhe === 'Desobrigação';

  return (
    <section className="card" style={{ paddingBlock: 4 }}>
      {concluidos.length ? (
        <div className="list">
          {concluidos.map(p => (
            <div key={p.id} className="row">
              <div className="row-main">
                <div className="row-t">{p.nome}</div>
                <div className="row-m">
                  <span>{p.chamado || 'Chamado não informado'}</span>
                </div>
              </div>
              <div className="acts">
                <span className={`tag ${isDes(p) ? 'tag-warn' : 'tag-bispado'}`}>
                  {isDes(p) ? 'Desobrigação' : 'Chamado'}
                </span>
                {canWrite && (
                  <>
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => onReopen(p.id)}
                    >
                      Reabrir
                    </button>
                    <button
                      type="button"
                      className="btn ghost sm danger"
                      onClick={() => onCancel(p.id, p.nome, isDes(p))}
                      title="Excluir do histórico"
                    >
                      Excluir
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty" style={{ marginBlock: 12 }}>
          Nada concluído ainda.
        </div>
      )}
    </section>
  );
};
