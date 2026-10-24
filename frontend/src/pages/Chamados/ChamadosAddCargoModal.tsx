import React, { useEffect, useMemo, useState } from 'react';
import { Membro, Organizacao } from '../../types';

interface ChamadosAddCargoModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSubOrg: Organizacao | null;
  members: Membro[];
  memberCallingsMap: Record<string, string[]>;
  onSubmit: (titulo: string, pessoa: string) => void;
}

export const ChamadosAddCargoModal: React.FC<ChamadosAddCargoModalProps> = ({
  isOpen,
  onClose,
  activeSubOrg,
  members,
  memberCallingsMap,
  onSubmit,
}) => {
  const [newCargoTitulo, setNewCargoTitulo] = useState('');
  const [newCargoPessoa, setNewCargoPessoa] = useState('');
  const [newCargoFilterText, setNewCargoFilterText] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setNewCargoTitulo('');
    setNewCargoPessoa('');
    setNewCargoFilterText('');
  }, [isOpen]);

  const filteredMembersForNewCargo = useMemo(() => {
    const q = newCargoFilterText.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      m => m.nome.toLowerCase().includes(q) || (m.nomeOriginal && m.nomeOriginal.toLowerCase().includes(q))
    );
  }, [newCargoFilterText, members]);

  if (!isOpen || !activeSubOrg) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCargoTitulo.trim()) return;
    onSubmit(newCargoTitulo.trim(), newCargoPessoa.trim());
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <h3>Novo chamado · {activeSubOrg.nome}</h3>
        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label>Nome do chamado *</label>
            <input
              className="inp"
              value={newCargoTitulo}
              onChange={e => setNewCargoTitulo(e.target.value)}
              placeholder="Ex.: 1º Conselheiro, Secretário Assistente"
              required
            />
          </div>

          <div className="field">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Quem serve</span>
              {members.length > 0 && (
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {members.length} membros na ala
                </span>
              )}
            </label>

            <input
              className="inp"
              type="search"
              placeholder="🔍 Digite para filtrar a lista abaixo..."
              value={newCargoFilterText}
              onChange={e => setNewCargoFilterText(e.target.value)}
              style={{ marginBottom: 6, fontSize: '12.5px', padding: '6px 10px' }}
            />

            <select
              className="inp"
              value={newCargoPessoa}
              onChange={e => setNewCargoPessoa(e.target.value)}
              style={{ fontSize: '13.5px' }}
            >
              <option value="">(Nenhum / Chamado Vago)</option>
              {filteredMembersForNewCargo.map(m => {
                const callings = memberCallingsMap[m.nome.toLowerCase().trim()];
                const extra = callings && callings.length > 0 ? ` [⚠️ Já serve: ${callings[0]}]` : '';
                const metaParts = [
                  m.idade ? `${m.idade} anos` : '',
                  m.sexo ? (m.sexo === 'M' ? 'M' : 'F') : '',
                ].filter(Boolean).join(', ');
                return (
                  <option key={m.id} value={m.nome}>
                    {m.nome} {metaParts ? `(${metaParts})` : ''}{extra}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="foot">
            <div className="btns">
              <button type="submit" className="btn pri">
                Adicionar chamado
              </button>
              <button type="button" className="btn ghost" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
