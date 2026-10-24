import React, { useState } from 'react';
import { NatalGasto } from '../../types';
import { IconTrash, IconPlus } from '../../components/Icons';
import { NATAL_CATEGORIAS } from './natalConstants';

interface NatalFinanceiroTabProps {
  gastos: NatalGasto[];
  onExcluirGasto: (id: string) => void;
  onAdicionarGasto: (gasto: {
    descricao: string;
    categoria: string;
    valorEstimado: string;
    valorReal: string;
    comprovante: boolean;
    responsavel: string;
  }) => Promise<void>;
}

export const NatalFinanceiroTab: React.FC<NatalFinanceiroTabProps> = ({
  gastos,
  onExcluirGasto,
  onAdicionarGasto,
}) => {
  const [novoGasto, setNovoGasto] = useState({
    descricao: '',
    categoria: 'decoracao',
    valorEstimado: '',
    valorReal: '',
    comprovante: false,
    responsavel: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoGasto.descricao || !novoGasto.valorEstimado) return;
    await onAdicionarGasto(novoGasto);
    setNovoGasto({
      descricao: '',
      categoria: 'decoracao',
      valorEstimado: '',
      valorReal: '',
      comprovante: false,
      responsavel: '',
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Itens de Custo e Compras</h3>
        {gastos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)' }}>
            Nenhum gasto orçado ou registrado para a festa.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Resp.</th>
                <th>Estimado</th>
                <th>Real</th>
                <th>Comp.?</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {gastos.map(g => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 600 }}>{g.descricao}</td>
                  <td>
                    <span className="badge badge-info">{g.categoria}</span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{g.responsavel || '-'}</td>
                  <td>R$ {g.valorEstimado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ fontWeight: 600, color: g.valorReal ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                    {g.valorReal ? `R$ ${g.valorReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td>{g.comprovante ? '✅' : '⏳'}</td>
                  <td>
                    <button
                      className="btn-icon"
                      onClick={() => onExcluirGasto(g.id)}
                      style={{ color: 'var(--color-error)' }}
                      title="Excluir gasto"
                    >
                      <IconTrash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Novo Gasto */}
      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Lançar Custo / Compra</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="label">Item / Descrição</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: Luzes de Natal e fitas"
              value={novoGasto.descricao}
              onChange={e => setNovoGasto({ ...novoGasto, descricao: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Categoria</label>
            <select
              className="input"
              value={novoGasto.categoria}
              onChange={e => setNovoGasto({ ...novoGasto, categoria: e.target.value })}
            >
              {NATAL_CATEGORIAS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Valor Estimado (R$)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              placeholder="0,00"
              value={novoGasto.valorEstimado}
              onChange={e => setNovoGasto({ ...novoGasto, valorEstimado: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Valor Real / Pago (R$)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              placeholder="Opcional se ainda não foi pago"
              value={novoGasto.valorReal}
              onChange={e => setNovoGasto({ ...novoGasto, valorReal: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Quem fez a compra</label>
            <input
              type="text"
              className="input"
              placeholder="Nome do irmão(ã)"
              value={novoGasto.responsavel}
              onChange={e => setNovoGasto({ ...novoGasto, responsavel: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <input
              type="checkbox"
              id="chkComp"
              checked={novoGasto.comprovante}
              onChange={e => setNovoGasto({ ...novoGasto, comprovante: e.target.checked })}
            />
            <label htmlFor="chkComp" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
              Comprovante / Nota entregue ao Bispado
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
            <IconPlus size={16} /> Lançar Despesa
          </button>
        </form>
      </div>
    </div>
  );
};
