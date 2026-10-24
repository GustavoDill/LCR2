import React from 'react';
import { Atividade, AprovacaoAtividade } from '../../types';
import { MONTH_NAMES_SHORT } from './atividadesConstants';
import { formatDaysText, getDaysUntil, getStatus, parseDateParts } from './atividadesUtils';

interface AtividadeCardProps {
  a: Atividade;
  aprovacoes: Record<string, AprovacaoAtividade>;
  onClick: (a: Atividade) => void;
}

export const AtividadeCard: React.FC<AtividadeCardProps> = ({ a, aprovacoes, onClick }) => {
  const st = getStatus(a, aprovacoes);
  const parts = parseDateParts(a.data);
  const diffDays = getDaysUntil(a.data);
  const isUrgent = diffDays !== null && diffDays >= 0 && diffDays <= 14;
  const daysLabel = formatDaysText(diffDays);

  let accentClass = 'accent-red';
  if (st === 'aprovada') accentClass = 'accent-green';
  else if (st === 'ajustes') accentClass = 'accent-blue';
  else if (st === 'recusada') accentClass = 'accent-gray';

  return (
    <div
      className={`atv-card ${accentClass}`}
      onClick={() => onClick(a)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(a);
        }
      }}
    >
      <div className="atv-card-date">
        <span className="atv-card-day">{parts?.day ? String(parts.day).padStart(2, '0') : '—'}</span>
        <span className="atv-card-month">{parts?.month !== undefined ? MONTH_NAMES_SHORT[parts.month] : 'ALA'}</span>
      </div>

      <div className="atv-card-body">
        <div className="atv-card-title">{a.titulo}</div>
        <div className="atv-card-meta">
          <span>{a.org}</span>
          <span>{a.solicitante?.nome || a.responsavel}</span>
          {a.inicio && <span>{a.inicio}{a.fim ? `–${a.fim}` : ''}</span>}
          <span>{a.local === 'capela' ? 'Capela da ala' : (a.localOutro || 'Outro local')}</span>
        </div>

        <div className="atv-card-chips">
          {st === 'aguardando' && <span className="atv-chip status-wait">Aguardando aprovação</span>}
          {st === 'aprovada' && <span className="atv-chip status-ok">Aprovada</span>}
          {st === 'ajustes' && <span className="atv-chip status-warn">Ajustes necessários</span>}
          {st === 'recusada' && <span className="atv-chip status-danger">Não aprovada</span>}

          {a.proposito && <span className="atv-chip">{a.proposito}</span>}

          {a.local === 'capela' && (
            <span className={`atv-chip ${a.capela === 'sim' ? 'capela-ok' : 'capela-warn'}`}>
              {a.capela === 'sim' ? 'Capela reservada' : 'Capela não reservada'}
            </span>
          )}

          {daysLabel && (
            <span className={`atv-chip ${isUrgent ? 'days-warn' : ''}`}>
              {daysLabel}
            </span>
          )}

          {a.custo === 'sim' && (
            <span className="atv-chip">
              R$ {Number(a.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>

        {a.liderExtra === 'sim' && (
          <span className="atv-card-leader">
            Precisa de líder: {a.liderQuem || 'Bispado'}
          </span>
        )}
      </div>
    </div>
  );
};
