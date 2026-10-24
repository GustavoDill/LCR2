import React, { useEffect, useState } from 'react';
import { Membro } from '../../types';

export interface MembroFormData {
  nome: string;
  sexo: 'M' | 'F' | '';
  nascimento: string;
  telefone: string;
  email: string;
  endereco: string;
  chamado: string;
  obs: string;
}

interface MembroFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMember: Membro | null;
  onSubmit: (data: MembroFormData) => void;
  onDelete: (id: string) => void;
}

export const MembroFormModal: React.FC<MembroFormModalProps> = ({
  isOpen,
  onClose,
  editingMember,
  onSubmit,
  onDelete,
}) => {
  const [formNome, setFormNome] = useState('');
  const [formSexo, setFormSexo] = useState<'M' | 'F' | ''>('');
  const [formNascimento, setFormNascimento] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formEndereco, setFormEndereco] = useState('');
  const [formChamado, setFormChamado] = useState('');
  const [formObs, setFormObs] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingMember) {
      setFormNome(editingMember.nome || '');
      setFormSexo(editingMember.sexo || '');
      setFormNascimento(editingMember.nascimento || '');
      setFormTelefone(editingMember.telefone || '');
      setFormEmail(editingMember.email || '');
      setFormEndereco(editingMember.endereco || '');
      setFormChamado(editingMember.chamado || '');
      setFormObs(editingMember.obs || '');
    } else {
      setFormNome('');
      setFormSexo('');
      setFormNascimento('');
      setFormTelefone('');
      setFormEmail('');
      setFormEndereco('');
      setFormChamado('');
      setFormObs('');
    }
  }, [isOpen, editingMember]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      alert('O nome é obrigatório.');
      return;
    }
    onSubmit({
      nome: formNome.trim(),
      sexo: formSexo,
      nascimento: formNascimento,
      telefone: formTelefone.trim(),
      email: formEmail.trim(),
      endereco: formEndereco.trim(),
      chamado: formChamado.trim(),
      obs: formObs.trim(),
    });
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <h3>{editingMember ? 'Editar membro' : 'Novo membro'}</h3>
        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label>Nome completo *</label>
            <input
              className="inp"
              value={formNome}
              onChange={e => setFormNome(e.target.value)}
              required
            />
          </div>

          <div className="two">
            <div className="field">
              <label>Sexo</label>
              <select
                className="inp"
                value={formSexo}
                onChange={e => setFormSexo(e.target.value as any)}
              >
                <option value="">—</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>

            <div className="field">
              <label>Data de nascimento</label>
              <input
                className="inp"
                type="date"
                value={formNascimento}
                onChange={e => setFormNascimento(e.target.value)}
              />
            </div>
          </div>

          <div className="two">
            <div className="field">
              <label>Telefone</label>
              <input
                className="inp"
                value={formTelefone}
                onChange={e => setFormTelefone(e.target.value)}
              />
            </div>

            <div className="field">
              <label>E-mail</label>
              <input
                className="inp"
                type="email"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Chamado atual</label>
            <input
              className="inp"
              value={formChamado}
              onChange={e => setFormChamado(e.target.value)}
              placeholder="Deixe em branco se não tiver chamado"
            />
          </div>

          <div className="field">
            <label>Endereço</label>
            <input
              className="inp"
              value={formEndereco}
              onChange={e => setFormEndereco(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Observações</label>
            <textarea
              className="inp"
              value={formObs}
              onChange={e => setFormObs(e.target.value)}
            />
          </div>

          <div className="foot">
            <div className="btns">
              <button type="submit" className="btn pri">
                Salvar
              </button>
              <button type="button" className="btn ghost" onClick={onClose}>
                Cancelar
              </button>
            </div>

            {editingMember && (
              <button
                type="button"
                className="btn ghost danger"
                onClick={() => onDelete(editingMember.id)}
              >
                Excluir
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
