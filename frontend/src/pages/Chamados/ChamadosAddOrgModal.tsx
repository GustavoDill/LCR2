import React, { useEffect, useState } from 'react';

interface ChamadosAddOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (nome: string) => void;
}

export const ChamadosAddOrgModal: React.FC<ChamadosAddOrgModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [newOrgNome, setNewOrgNome] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setNewOrgNome('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgNome.trim()) return;
    onSubmit(newOrgNome.trim());
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <h3>Nova organização</h3>
        <p className="sub" style={{ marginTop: -8 }}>
          Crie uma organização principal (ex.: Bispado e Secretaria, Quórum de Élderes e Sociedade de Socorro, Classes das Moças).
        </p>

        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label>Nome da organização *</label>
            <input
              className="inp"
              value={newOrgNome}
              onChange={e => setNewOrgNome(e.target.value)}
              placeholder="Ex.: Bispado e Secretaria, Escola Dominical"
              required
            />
          </div>

          <div className="foot">
            <div className="btns">
              <button type="submit" className="btn pri">
                Criar organização
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
