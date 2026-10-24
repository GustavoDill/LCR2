import React, { useState } from 'react';
import { NatalTarefa } from '../../types';
import { IconTrash, IconPlus } from '../../components/Icons';
import { NATAL_AREAS } from './natalConstants';

interface NatalTarefasTabProps {
  tarefas: NatalTarefa[];
  onToggleTarefa: (t: NatalTarefa) => void;
  onExcluirTarefa: (id: string) => void;
  onAdicionarTarefa: (tarefa: { titulo: string; area: string; responsavel: string; prazo: string }) => Promise<void>;
}

export const NatalTarefasTab: React.FC<NatalTarefasTabProps> = ({
  tarefas,
  onToggleTarefa,
  onExcluirTarefa,
  onAdicionarTarefa,
}) => {
  const [novaTarefa, setNovaTarefa] = useState({
    titulo: '',
    area: 'geral',
    responsavel: '',
    prazo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaTarefa.titulo) return;
    await onAdicionarTarefa(novaTarefa);
    setNovaTarefa({ titulo: '', area: 'geral', responsavel: '', prazo: '' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Plano de Ação</h3>
        {tarefas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)' }}>
            Nenhuma tarefa cadastrada. Adicione ao lado ou gere a partir do modelo de ideias!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tarefas.map(t => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: t.status === 'concluida' ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  opacity: t.status === 'concluida' ? 0.7 : 1,
                  textDecoration: t.status === 'concluida' ? 'line-through' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="checkbox"
                    checked={t.status === 'concluida'}
                    onChange={() => onToggleTarefa(t)}
                    style={{ cursor: 'pointer', width: 18, height: 18 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{t.titulo}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', gap: 12, marginTop: 2 }}>
                      <span className="badge badge-info">{t.area}</span>
                      {t.responsavel && <span>Resp: <strong>{t.responsavel}</strong></span>}
                      {t.prazo && <span>Prazo: {new Date(t.prazo).toLocaleDateString('pt-BR')}</span>}
                    </div>
                  </div>
                </div>

                <button
                  className="btn-icon"
                  onClick={() => onExcluirTarefa(t.id)}
                  title="Excluir tarefa"
                  style={{ color: 'var(--color-error)' }}
                >
                  <IconTrash size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Nova Tarefa */}
      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Nova Tarefa</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="label">Título da Tarefa</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: Definir cardápio e sobremesas"
              value={novaTarefa.titulo}
              onChange={e => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Área</label>
            <select
              className="input"
              value={novaTarefa.area}
              onChange={e => setNovaTarefa({ ...novaTarefa, area: e.target.value })}
            >
              {NATAL_AREAS.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Responsável</label>
            <input
              type="text"
              className="input"
              placeholder="Nome do membro ou comitê"
              value={novaTarefa.responsavel}
              onChange={e => setNovaTarefa({ ...novaTarefa, responsavel: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Prazo Final</label>
            <input
              type="date"
              className="input"
              value={novaTarefa.prazo}
              onChange={e => setNovaTarefa({ ...novaTarefa, prazo: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
            <IconPlus size={16} /> Adicionar Tarefa
          </button>
        </form>
      </div>
    </div>
  );
};
