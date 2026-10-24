import React from 'react';
import { money } from './financeiroUtils';

interface LineOption {
  id: string;
  nome: string;
  saldo: number;
}

interface FinanceiroExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingLancamentoId: string | null;
  selectedPeriod: string;
  expValor: string;
  setExpValor: (v: string) => void;
  expLinha: string;
  setExpLinha: (v: string) => void;
  expDesc: string;
  setExpDesc: (v: string) => void;
  expData: string;
  setExpData: (v: string) => void;
  expNota: string;
  setExpNota: (v: string) => void;
  expSolicitante: string;
  setExpSolicitante: (v: string) => void;
  linesWithSpending: LineOption[];
  canWrite: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: (id: string) => void;
}

export const FinanceiroExpenseModal: React.FC<FinanceiroExpenseModalProps> = ({
  isOpen,
  onClose,
  editingLancamentoId,
  selectedPeriod,
  expValor,
  setExpValor,
  expLinha,
  setExpLinha,
  expDesc,
  setExpDesc,
  expData,
  setExpData,
  expNota,
  setExpNota,
  expSolicitante,
  setExpSolicitante,
  linesWithSpending,
  canWrite,
  onSubmit,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <h3>
          {editingLancamentoId ? 'Editar despesa' : 'Lançar despesa'} · {selectedPeriod}
        </h3>
        <form onSubmit={onSubmit} className="form">
          <div className="two">
            <div className="field">
              <label>Valor (R$) *</label>
              <input
                className="inp"
                value={expValor}
                onChange={e => setExpValor(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
            <div className="field">
              <label>Organização</label>
              <select
                className="inp"
                value={expLinha}
                onChange={e => setExpLinha(e.target.value)}
              >
                {linesWithSpending.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.nome} · saldo {money(l.saldo)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Descrição *</label>
            <input
              className="inp"
              value={expDesc}
              onChange={e => setExpDesc(e.target.value)}
              placeholder="Ex.: Lanche da atividade dos jovens"
              required
            />
          </div>

          <div className="two">
            <div className="field">
              <label>Data da nota</label>
              <input
                className="inp"
                type="date"
                value={expData}
                onChange={e => setExpData(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Nº da nota fiscal (opcional)</label>
              <input
                className="inp"
                value={expNota}
                onChange={e => setExpNota(e.target.value)}
                placeholder="Ex.: NF 12345"
              />
            </div>
          </div>

          <div className="field">
            <label>Solicitado por (opcional)</label>
            <input
              className="inp"
              value={expSolicitante}
              onChange={e => setExpSolicitante(e.target.value)}
              placeholder="Ex.: Irmão João Silva"
            />
          </div>

          <div className="foot">
            <div className="btns" style={{ justifyContent: 'space-between', width: '100%' }}>
              <div>
                {editingLancamentoId && canWrite && (
                  <button
                    type="button"
                    className="btn ghost sm s-crit"
                    onClick={() => onDelete(editingLancamentoId)}
                  >
                    Excluir despesa
                  </button>
                )}
              </div>
              <div className="btns">
                <button type="button" className="btn ghost" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn pri">
                  {editingLancamentoId ? 'Salvar alterações' : 'Salvar despesa'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
