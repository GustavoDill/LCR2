import React, { useEffect, useState } from 'react';
import { Ata, Membro } from '../../types';

interface ReuniaoNewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMeeting: Ata | null;
  members: Membro[];
  onSubmit: (titulo: string, responsavel: string, prazo: string) => void;
}

export const ReuniaoNewTaskModal: React.FC<ReuniaoNewTaskModalProps> = ({
  isOpen,
  onClose,
  activeMeeting,
  members,
  onSubmit,
}) => {
  const [newTaskTitulo, setNewTaskTitulo] = useState('');
  const [newTaskResponsavel, setNewTaskResponsavel] = useState('Bispo');
  const [newTaskPrazo, setNewTaskPrazo] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setNewTaskTitulo('');
    setNewTaskResponsavel('Bispo');
    setNewTaskPrazo(new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0]);
  }, [isOpen]);

  if (!isOpen || !activeMeeting) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitulo.trim()) return;
    onSubmit(newTaskTitulo.trim(), newTaskResponsavel.trim(), newTaskPrazo);
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <h3>+ Nova Designação na Reunião</h3>
        <p className="sub" style={{ marginTop: -8 }}>
          {activeMeeting.tipo === 'bispado' ? 'Reunião de Bispado' : 'Conselho da Ala'} · {activeMeeting.data}
        </p>

        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label>Designação *</label>
            <input
              className="inp"
              value={newTaskTitulo}
              onChange={e => setNewTaskTitulo(e.target.value)}
              placeholder="Ex.: Visitar família com o presidente do quórum"
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Responsável</span>
              {members.length > 0 && (
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {members.length} membros na ala
                </span>
              )}
            </label>

            {/* Atalhos rápidos de liderança */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '6px' }}>
              {['Bispo', '1º Conselheiro', '2º Conselheiro', 'Secretário', 'Pres. Élderes', 'Pres. Soc. Socorro'].map(preset => (
                <button
                  key={preset}
                  type="button"
                  className="chip sm"
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                  onClick={() => setNewTaskResponsavel(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>

            <input
              className="inp"
              list="membros-meeting-list"
              value={newTaskResponsavel}
              onChange={e => setNewTaskResponsavel(e.target.value)}
              placeholder="Digite um cargo ou selecione um membro..."
            />
            <datalist id="membros-meeting-list">
              {members.map(m => (
                <option key={m.id} value={m.nome}>
                  {m.chamado ? `${m.nome} (${m.chamado})` : m.nome}
                </option>
              ))}
            </datalist>
          </div>

          <div className="field">
            <label>Prazo de conclusão</label>
            <input
              className="inp"
              type="date"
              value={newTaskPrazo}
              onChange={e => setNewTaskPrazo(e.target.value)}
            />
          </div>

          <div className="btns" style={{ marginTop: 12 }}>
            <button type="submit" className="btn pri">
              Criar designação
            </button>
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
