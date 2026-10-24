import React, { useEffect, useState } from 'react';
import { Organizacao, OrganizacaoItem } from '../../types';

interface ChamadosAddSubOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgList: OrganizacaoItem[];
  suborgs: Organizacao[];
  initialParentOrgNome?: string;
  onSubmit: (nome: string, grupo: string) => void;
}

export const ChamadosAddSubOrgModal: React.FC<ChamadosAddSubOrgModalProps> = ({
  isOpen,
  onClose,
  orgList,
  suborgs,
  initialParentOrgNome,
  onSubmit,
}) => {
  const [newSubOrgNome, setNewSubOrgNome] = useState('');
  const [newSubOrgGrupo, setNewSubOrgGrupo] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const parent = initialParentOrgNome || (orgList[0]?.nome || 'Bispado e Secretaria');
    setNewSubOrgGrupo(parent);
    setNewSubOrgNome('');
  }, [isOpen, initialParentOrgNome, orgList]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubOrgNome.trim() || !newSubOrgGrupo.trim()) return;
    onSubmit(newSubOrgNome.trim(), newSubOrgGrupo.trim());
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <h3>Nova suborganização</h3>
        <p className="sub" style={{ marginTop: -8 }}>
          Pertence à organização: <b>{newSubOrgGrupo}</b>
        </p>

        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label>Organização Pai (Nível 1)</label>
            <select
              className="inp"
              value={newSubOrgGrupo}
              onChange={e => setNewSubOrgGrupo(e.target.value)}
              required
            >
              {orgList.map(o => (
                <option key={o.id} value={o.nome}>
                  {o.nome}
                </option>
              ))}
              {Array.from(new Set(suborgs.map(s => s.grupo || 'Outros')))
                .filter(g => !orgList.some(o => o.nome === g))
                .map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
            </select>
          </div>

          <div className="field">
            <label>Nome da suborganização *</label>
            <input
              className="inp"
              value={newSubOrgNome}
              onChange={e => setNewSubOrgNome(e.target.value)}
              placeholder="Ex.: Bispado, Secretaria da Ala, Quórum de Élderes"
              required
            />
          </div>

          <div className="foot">
            <div className="btns">
              <button type="submit" className="btn pri">
                Criar suborganização
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
