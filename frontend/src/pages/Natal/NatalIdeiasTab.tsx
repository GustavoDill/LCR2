import React from 'react';
import { NatalEvento } from '../../types';
import { IconSparkles } from '../../components/Icons';

interface NatalIdeiasTabProps {
  evento: NatalEvento;
  setEvento: React.Dispatch<React.SetStateAction<NatalEvento>>;
  isBishopric: boolean;
  onSalvarEvento: (e: React.FormEvent) => Promise<void>;
  onAplicarIdeias: () => Promise<void>;
}

export const NatalIdeiasTab: React.FC<NatalIdeiasTabProps> = ({
  evento,
  setEvento,
  isBishopric,
  onSalvarEvento,
  onAplicarIdeias,
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Configurações do Evento</h3>
        <form onSubmit={onSalvarEvento} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="label">Tema da Festa</label>
            <input
              type="text"
              className="input"
              value={evento.tema}
              onChange={e => setEvento({ ...evento, tema: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Data</label>
              <input
                type="date"
                className="input"
                value={evento.data}
                onChange={e => setEvento({ ...evento, data: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Horário</label>
              <input
                type="time"
                className="input"
                value={evento.horario}
                onChange={e => setEvento({ ...evento, horario: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Local</label>
            <input
              type="text"
              className="input"
              value={evento.local}
              onChange={e => setEvento({ ...evento, local: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Teto Orçamentário da Ala (R$)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={evento.orcamentoTotal || ''}
              onChange={e => setEvento({ ...evento, orcamentoTotal: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div>
            <label className="label">Foco Missionário / Propósito</label>
            <textarea
              className="textarea"
              rows={3}
              value={evento.foco || ''}
              onChange={e => setEvento({ ...evento, foco: e.target.value })}
            />
          </div>

          {isBishopric && (
            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
              Salvar Configurações
            </button>
          )}
        </form>
      </div>

      <div className="card" style={{ background: 'var(--color-surface-hover)' }}>
        <h3 style={{ marginTop: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconSparkles size={20} color="var(--color-primary)" />
          Sugestões e Templates Pré-definidos
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          Precisa de inspiração para a organização? Você pode importar uma estrutura completa de checklist recomendada para festas de ala da Igreja.
        </p>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: 12, background: 'var(--color-surface)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
            <strong>Programa Espiritual Centrado no Salvador</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Apresentação das crianças da Primária cantando hinos natalinos, leitura dramatizada de Lucas 2 e vídeo oficial da Primeira Presidência.
            </p>
          </div>

          <div style={{ padding: 12, background: 'var(--color-surface)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
            <strong>Jantar Compartilhado / Potluck Organizado</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              O Bispado providencia a carne principal (chester/pernil com orçamento da ala) e as famílias trazem saladas, arroz e sobremesas típicas.
            </p>
          </div>

          <div style={{ padding: 12, background: 'var(--color-surface)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
            <strong>Árvore da Bondade (Serviço)</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Cartões com metas de serviço diário até o dia de Natal para os jovens e membros levarem para casa.
            </p>
          </div>
        </div>

        <button
          onClick={onAplicarIdeias}
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: 20 }}
        >
          <IconSparkles size={16} /> Importar Checklist Sugerido
        </button>
      </div>
    </div>
  );
};
