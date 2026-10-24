import React from 'react';
import { LancamentoFinanceiro } from '../../types';
import { money, perMesesTxt } from './financeiroUtils';

export interface BudgetLineInput {
  id: string;
  nome: string;
  valor: number | string;
}

interface FinanceiroBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  curTri: number;
  curYear: number;
  selectedPeriod: string;
  bgRec: string;
  setBgRec: (v: string) => void;
  bgLinhas: BudgetLineInput[];
  updateBudgetLine: (id: string, field: 'nome' | 'valor', val: any) => void;
  removeBudgetLine: (id: string) => void;
  addBudgetLine: () => void;
  onSubmit: (e: React.FormEvent) => void;
  currentLancamentos: LancamentoFinanceiro[];
}

export const FinanceiroBudgetModal: React.FC<FinanceiroBudgetModalProps> = ({
  isOpen,
  onClose,
  curTri,
  curYear,
  selectedPeriod,
  bgRec,
  setBgRec,
  bgLinhas,
  updateBudgetLine,
  removeBudgetLine,
  addBudgetLine,
  onSubmit,
  currentLancamentos,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <h3>Orçamento · {curTri}º trimestre de {curYear}</h3>
        <p className="sub" style={{ margin: '-6px 0 12px' }}>{perMesesTxt(selectedPeriod)}</p>

        <form onSubmit={onSubmit} className="form">
          <div className="field">
            <label>Valor recebido da Igreja para o trimestre (R$)</label>
            <input
              className="inp"
              value={bgRec}
              onChange={e => setBgRec(e.target.value)}
              placeholder="9.600,00"
              required
            />
          </div>

          <div className="grp">
            <span className="lbl">Divisão por organização ou evento</span>
            <div className="form" style={{ gap: 8 }}>
              {bgLinhas.map(l => (
                <div key={l.id} className="budget-row">
                  <input
                    className="inp"
                    value={l.nome}
                    onChange={e => updateBudgetLine(l.id, 'nome', e.target.value)}
                    placeholder="Ex.: Sociedade de Socorro"
                    required
                  />
                  <input
                    className="inp"
                    type="text"
                    inputMode="decimal"
                    value={l.valor}
                    onChange={e => updateBudgetLine(l.id, 'valor', e.target.value)}
                    placeholder="0,00"
                  />
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => removeBudgetLine(l.id)}
                    title={currentLancamentos.some(x => x.linha === l.id) ? 'Esta organização possui despesas lançadas' : 'Remover categoria'}
                    aria-label="Remover linha"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn sm"
              onClick={addBudgetLine}
              style={{ alignSelf: 'flex-start', marginTop: 8 }}
            >
              + Adicionar linha
            </button>
          </div>

          {(() => {
            const recVal = parseFloat(bgRec.replace(/\./g, '').replace(',', '.')) || 0;
            const sumVal = bgLinhas.reduce((s, l) => {
              const v = typeof l.valor === 'number' ? l.valor : parseFloat(String(l.valor).replace(/\./g, '').replace(',', '.')) || 0;
              return s + v;
            }, 0);
            const diff = recVal - sumVal;
            return (
              <div style={{ marginTop: 8 }}>
                <div className="btot">
                  <span>Distribuído</span>
                  <span className="money">{money(sumVal)}</span>
                </div>
                <div className="btot">
                  <span>{diff >= 0 ? 'Sem destino' : 'Acima do recebido'}</span>
                  <span className={`money ${diff < 0 ? 's-crit' : ''}`}>
                    {money(Math.abs(diff))}
                  </span>
                </div>
              </div>
            );
          })()}

          <div className="foot">
            <div className="btns">
              <button type="button" className="btn ghost" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn pri">
                Salvar orçamento
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
