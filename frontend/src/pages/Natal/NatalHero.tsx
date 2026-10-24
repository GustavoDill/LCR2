import React from 'react';
import { NatalEvento } from '../../types';

interface NatalHeroProps {
  evento: NatalEvento;
  diffDias: number;
  tarefasConcluidas: number;
  totalTarefas: number;
  percentualTarefas: number;
  totalReal: number;
  saldoOrcamento: number;
}

export const NatalHero: React.FC<NatalHeroProps> = ({
  evento,
  diffDias,
  tarefasConcluidas,
  totalTarefas,
  percentualTarefas,
  totalReal,
  saldoOrcamento,
}) => {
  return (
    <div className="xmas-hero">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>✨</span>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem', opacity: 0.85, fontWeight: 700 }}>
              Comitê Especial Ala Bosque
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', margin: '0 0 8px 0' }}>
            Festa de Natal 2025
          </h1>
          <p style={{ margin: 0, opacity: 0.9, maxWidth: 600 }}>
            Tema: &ldquo;{evento.tema || 'O Presente Supremo'}&rdquo; • {evento.local || 'Capela'}
          </p>
        </div>

        <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '16px 24px', borderRadius: 'var(--radius)', minWidth: 160 }}>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
            {diffDias > 0 ? diffDias : 0}
          </div>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9, marginTop: 4 }}>
            {diffDias === 1 ? 'Dia Restante' : 'Dias Restantes'}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.75, marginTop: 4 }}>
            {new Date(evento.data).toLocaleDateString('pt-BR')} às {evento.horario}
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Tarefas Concluídas</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            {tarefasConcluidas} / {totalTarefas} ({percentualTarefas}%)
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Orçamento Teto</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            R$ {evento.orcamentoTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Gasto Realizado</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            R$ {totalReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Saldo Disponível</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: saldoOrcamento < 0 ? '#ffb4ab' : '#b7f397' }}>
            R$ {saldoOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
};
