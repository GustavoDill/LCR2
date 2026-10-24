import React from 'react';
import { Membro } from '../../types';
import { ageOf } from './membrosUtils';

export interface ActiveCalling {
  suborgId: string;
  suborgNome: string;
  orgGrupo: string;
  cargoId: string;
  cargoTitulo: string;
  desde?: string;
}

interface MembrosListProps {
  filtered: Membro[];
  limit: number;
  setLimit: React.Dispatch<React.SetStateAction<number>>;
  canWrite: boolean;
  getMemberActiveCallings: (m: Membro) => ActiveCalling[];
  onOpenDrawer: (m: Membro) => void;
  onEditMember: (m: Membro) => void;
}

export const MembrosList: React.FC<MembrosListProps> = ({
  filtered,
  limit,
  setLimit,
  canWrite,
  getMemberActiveCallings,
  onOpenDrawer,
  onEditMember,
}) => {
  if (!filtered.length) {
    return (
      <div className="empty" style={{ marginBlock: 12 }}>
        Nenhum membro encontrado com os filtros selecionados.
      </div>
    );
  }

  return (
    <>
      <div className="list">
        {filtered.slice(0, limit).map(m => {
          const age = ageOf(m);
          const activeCallings = getMemberActiveCallings(m);
          return (
            <div
              key={m.id}
              className="row member-clickable-row"
              onClick={() => onOpenDrawer(m)}
              title="Clique para abrir a Ficha 360° deste membro"
            >
              <div className="row-main">
                <div className="row-t" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600 }}>{m.nome}</span>
                  {m.nomeOriginal && m.nomeOriginal !== m.nome && (
                    <span style={{ color: 'var(--muted)', fontSize: '11.5px', fontWeight: 'normal' }}>
                      ({m.nomeOriginal})
                    </span>
                  )}
                </div>
                <div className="row-m" style={{ alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {age != null && <span>{age} anos</span>}
                  {m.sexo && <span>{m.sexo === 'M' ? 'Masculino' : 'Feminino'}</span>}
                  {m.nascimento && <span>📅 {m.nascimento}</span>}
                  {m.telefone && (
                    <span onClick={e => e.stopPropagation()}>
                      <a href={`tel:${m.telefone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        📞 {m.telefone}
                      </a>
                    </span>
                  )}
                  {m.email && (
                    <span onClick={e => e.stopPropagation()}>
                      <a href={`mailto:${m.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        ✉️ {m.email}
                      </a>
                    </span>
                  )}
                  {/* Badges de Chamados Conectados à Lista */}
                  <div className="badge-calling-container">
                    {activeCallings.length > 0 ? (
                      activeCallings.map(c => (
                        <span key={c.cargoId} className="badge-calling" title={`Organização: ${c.suborgNome}`}>
                          👑 {c.cargoTitulo} <span className="badge-org">· {c.suborgNome}</span>
                        </span>
                      ))
                    ) : m.chamado?.trim() ? (
                      <span className="badge-calling badge-calling-legacy" title="Registrado no cadastro">
                        📋 {m.chamado}
                      </span>
                    ) : (
                      <span className="badge-sem-chamado">Sem chamado</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="acts" onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  className="btn sm btn-360"
                  onClick={() => onOpenDrawer(m)}
                  title="Abrir ficha 360° com histórico, chamados e designações"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Ficha 360°
                </button>
                {canWrite && (
                  <button
                    type="button"
                    className="btn sm"
                    onClick={() => onEditMember(m)}
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length > limit && (
        <button
          type="button"
          className="btn ghost sm"
          style={{ marginTop: 8 }}
          onClick={() => setLimit(l => l + 60)}
        >
          Mostrar mais ({filtered.length - limit} restantes)
        </button>
      )}
    </>
  );
};
