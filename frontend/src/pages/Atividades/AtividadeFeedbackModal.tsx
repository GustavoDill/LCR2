import React, { useState } from 'react';
import { Atividade } from '../../types';

export interface FeedbackData {
  fbSucesso: string;
  fbMembros: string;
  fbNaoMembros: string;
  fbMelhorar: string;
}

interface AtividadeFeedbackModalProps {
  feedbackAtv: Atividade | null;
  onClose: () => void;
  onSubmit: (data: FeedbackData) => void;
}

export const AtividadeFeedbackModal: React.FC<AtividadeFeedbackModalProps> = ({
  feedbackAtv,
  onClose,
  onSubmit,
}) => {
  const [fbSucesso, setFbSucesso] = useState('');
  const [fbMembros, setFbMembros] = useState('');
  const [fbNaoMembros, setFbNaoMembros] = useState('');
  const [fbMelhorar, setFbMelhorar] = useState('');

  if (!feedbackAtv) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ fbSucesso, fbMembros, fbNaoMembros, fbMelhorar });
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <h3>Feedback pós-atividade</h3>
        <p className="sub" style={{ marginTop: -8 }}>{feedbackAtv.titulo}</p>

        <form onSubmit={handleSubmit} className="form" style={{ marginTop: 10 }}>
          <div className="field">
            <label>Qual foi o sucesso alcançado?</label>
            <textarea
              className="inp"
              value={fbSucesso}
              onChange={e => setFbSucesso(e.target.value)}
              placeholder="Como a atividade fortaleceu os participantes"
              rows={3}
              required
            />
          </div>

          <div className="two">
            <div className="field">
              <label>Membros participantes</label>
              <input
                className="inp"
                type="number"
                value={fbMembros}
                onChange={e => setFbMembros(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="field">
              <label>Amigos / não membros</label>
              <input
                className="inp"
                type="number"
                value={fbNaoMembros}
                onChange={e => setFbNaoMembros(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="field">
            <label>O que podemos melhorar na próxima vez?</label>
            <textarea
              className="inp"
              value={fbMelhorar}
              onChange={e => setFbMelhorar(e.target.value)}
              placeholder="Pontos de melhoria para futuras atividades"
              rows={2}
            />
          </div>

          <div className="foot">
            <div className="btns">
              <button type="submit" className="btn pri">
                Enviar feedback ao bispado
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
