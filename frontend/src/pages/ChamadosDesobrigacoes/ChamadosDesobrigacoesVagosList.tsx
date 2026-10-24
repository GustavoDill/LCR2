import React from 'react';
import { Cargo } from '../../types';
import { VacantCargoItem } from './chamadosDesobrigacoesConstants';

interface ChamadosDesobrigacoesVagosListProps {
  vagasList: VacantCargoItem[];
  canWrite: boolean;
  onIndicar: (preset: { orgId: string; orgNome: string; cargo: Cargo }) => void;
}

export const ChamadosDesobrigacoesVagosList: React.FC<ChamadosDesobrigacoesVagosListProps> = ({
  vagasList,
  canWrite,
  onIndicar,
}) => {
  return (
    <section className="card">
      <div className="head" style={{ marginBottom: 6 }}>
        <h3 style={{ margin: 0 }}>Cargos vagos cadastrados na Lista de Chamados</h3>
        <span className="row-m num">{vagasList.length} vagas</span>
      </div>
      <p className="sub" style={{ marginTop: 0 }}>
        Estes chamados não possuem ninguém servindo atualmente. Clique em “Indicar pessoa” para iniciar o fluxo formal.
      </p>

      {vagasList.length ? (
        <div className="vagas-grid">
          {vagasList.map(v => (
            <div key={v.cargo.id} className="vaga-card">
              <div className="vaga-header">
                <span className="vaga-tag">Vago</span>
                <div className="vaga-title">{v.cargo.titulo}</div>
                <div className="vaga-org">{v.orgNome} · {v.orgGrupo}</div>
                {v.cargo.pendente && (
                  <div className="vaga-pend">
                    ⏳ Em processo: {v.cargo.pendente.pessoa} ({v.cargo.pendente.etapa || 'Indicado'})
                  </div>
                )}
              </div>

              <div className="vaga-actions">
                {canWrite && (
                  <button
                    type="button"
                    className="btn sm bisp"
                    onClick={() => onIndicar({ orgId: v.orgId, orgNome: v.orgNome, cargo: v.cargo })}
                  >
                    + Indicar pessoa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty" style={{ marginBlock: 16 }}>
          Parabéns! Todos os chamados cadastrados da ala estão preenchidos.
        </div>
      )}
    </section>
  );
};
