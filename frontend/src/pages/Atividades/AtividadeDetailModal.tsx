import React from 'react';
import { Atividade, AprovacaoAtividade, AtividadeStatus, FinanceiroTrimestre, LancamentoFinanceiro } from '../../types';
import { formatDaysText, formatSubtitleDate, getDaysUntil, getOrgSaldoString, getStatus } from './atividadesUtils';

interface AtividadeDetailModalProps {
  selectedAtv: Atividade | null;
  onClose: () => void;
  aprovacoes: Record<string, AprovacaoAtividade>;
  isBishopric: boolean;
  canWrite: boolean;
  orcamentos: Record<string, FinanceiroTrimestre>;
  lancamentos: LancamentoFinanceiro[];
  decisionComment: string;
  setDecisionComment: (v: string) => void;
  customRecipientEmail: string;
  setCustomRecipientEmail: (v: string) => void;
  showEmailEdit: boolean;
  setShowEmailEdit: (v: boolean) => void;
  addToAgenda: boolean;
  setAddToAgenda: (v: boolean) => void;
  submittingDecision: boolean;
  onDecide: (status: AtividadeStatus) => void;
  onEdit: (atv: Atividade) => void;
  onDelete: (atv: Atividade) => void;
  onOpenFeedback: (atv: Atividade) => void;
}

export const AtividadeDetailModal: React.FC<AtividadeDetailModalProps> = ({
  selectedAtv,
  onClose,
  aprovacoes,
  isBishopric,
  canWrite,
  orcamentos,
  lancamentos,
  decisionComment,
  setDecisionComment,
  customRecipientEmail,
  setCustomRecipientEmail,
  showEmailEdit,
  setShowEmailEdit,
  addToAgenda,
  setAddToAgenda,
  submittingDecision,
  onDecide,
  onEdit,
  onDelete,
  onOpenFeedback,
}) => {
  if (!selectedAtv) return null;

  const st = getStatus(selectedAtv, aprovacoes);
  const daysUntil = getDaysUntil(selectedAtv.data);
  const daysLabel = formatDaysText(daysUntil);

  return (
    <div className="modal" onClick={onClose}>
      <div className="atv-modal-sheet" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="atv-popup-head">
          <h2 className="atv-popup-title">{selectedAtv.titulo}</h2>
          <span className={`atv-popup-status ap-${st}`}>
            {st === 'aprovada'
              ? 'Aprovada'
              : st === 'recusada'
              ? 'Não aprovada'
              : st === 'ajustes'
              ? 'Ajustes solicitados'
              : 'Aguardando aprovação'}
          </span>
        </div>

        {/* Subtitle */}
        <div className="atv-popup-sub">
          {selectedAtv.org} {formatSubtitleDate(selectedAtv.data, selectedAtv.inicio, selectedAtv.fim)}
        </div>

        {/* Row of chips */}
        <div className="atv-popup-chips">
          {selectedAtv.local === 'capela' && (
            <span className={`atv-chip ${selectedAtv.capela === 'sim' ? 'capela-ok' : 'capela-warn'}`}>
              {selectedAtv.capela === 'sim' ? 'Capela reservada' : 'Capela não reservada'}
            </span>
          )}
          {daysUntil !== null && (
            <span className={`atv-chip ${daysUntil >= 0 && daysUntil <= 14 ? 'days-warn' : ''}`}>
              {daysLabel}
            </span>
          )}
          {selectedAtv.custo === 'sim' && (
            <span className="atv-chip">
              R$ {Number(selectedAtv.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
          {selectedAtv.liderExtra === 'sim' && (
            <span className="atv-chip">
              Precisa de líder: {selectedAtv.liderQuem || 'Bispado'}
            </span>
          )}
        </div>

        {/* Key-Value Details Table */}
        <div className="atv-popup-table">
          <div className="atv-table-dt">Propósito</div>
          <div className="atv-table-dd">{selectedAtv.proposito || '—'}</div>

          <div className="atv-table-dt">Público</div>
          <div className="atv-table-dd">{selectedAtv.publico || '—'}</div>

          <div className="atv-table-dt">Participantes</div>
          <div className="atv-table-dd">{selectedAtv.participantes || '—'}</div>

          <div className="atv-table-dt">Objetivo</div>
          <div className="atv-table-dd">{selectedAtv.objetivo || '—'}</div>

          <div className="atv-table-dt">Local</div>
          <div className="atv-table-dd">
            {selectedAtv.local === 'capela' ? 'Capela da Ala Bosque' : selectedAtv.localOutro || 'Outro local'}
          </div>

          <div className="atv-table-dt">Capela reservada</div>
          <div className="atv-table-dd">
            {selectedAtv.capela === 'sim'
              ? 'Sim, já reservada'
              : selectedAtv.capela === 'nao'
              ? 'Ainda não, precisa reservar'
              : 'Não se aplica'}
          </div>

          <div className="atv-table-dt">Líder responsável</div>
          <div className="atv-table-dd">
            {selectedAtv.responsavel || selectedAtv.solicitante?.nome || '—'}
            {selectedAtv.telefone ? ` · ${selectedAtv.telefone}` : ''}
          </div>

          <div className="atv-table-dt">Líder de apoio</div>
          <div className="atv-table-dd">
            {selectedAtv.liderExtra === 'sim'
              ? `Sim - ${selectedAtv.liderQuem || 'Bispado'}`
              : 'Não'}
          </div>

          <div className="atv-table-dt">Custo</div>
          <div className="atv-table-dd">
            {selectedAtv.custo === 'sim'
              ? `R$ ${Number(selectedAtv.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · orçamento de ${selectedAtv.orcamento || selectedAtv.org}`
              : 'Sem custo'}
          </div>

          <div className="atv-table-dt">Itens</div>
          <div className="atv-table-dd">{selectedAtv.itens || '—'}</div>

          <div className="atv-table-dt">Crianças ou jovens</div>
          <div className="atv-table-dd">{selectedAtv.menores ? 'Sim' : 'Não'}</div>

          <div className="atv-table-dt">Logística</div>
          <div className="atv-table-dd">
            {[
              selectedAtv.alimentacao && 'alimentação',
              selectedAtv.transporte && 'transporte',
              selectedAtv.foraCidade && 'fora da cidade',
            ]
              .filter(Boolean)
              .join(', ') || '—'}
          </div>

          <div className="atv-table-dt">Observações</div>
          <div className="atv-table-dd">{selectedAtv.obs || '—'}</div>

          <div className="atv-table-dt">Saldo da organização</div>
          <div className="atv-table-dd">
            {getOrgSaldoString(selectedAtv.orcamento || selectedAtv.org, orcamentos, lancamentos)}
          </div>
        </div>

        {/* Existing bishopric comment if not bishopric or if already decided */}
        {aprovacoes[selectedAtv.id]?.comentario && !isBishopric && (
          <div
            style={{
              background:
                st === 'recusada'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : st === 'ajustes'
                  ? 'rgba(59, 130, 246, 0.1)'
                  : 'rgba(16, 185, 129, 0.1)',
              borderLeft: `4px solid ${
                st === 'recusada'
                  ? '#ef4444'
                  : st === 'ajustes'
                  ? '#3b82f6'
                  : '#10b981'
              }`,
              padding: '10px 14px',
              borderRadius: '6px',
              margin: '12px 0',
              fontSize: '13px',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--ink)' }}>
              {st === 'recusada'
                ? 'Motivo da reprovação:'
                : st === 'ajustes'
                ? 'Instruções do Bispado para alterações:'
                : 'Comentário do Bispado:'}
            </div>
            <div style={{ color: 'var(--ink)', whiteSpace: 'pre-line' }}>
              {aprovacoes[selectedAtv.id].comentario}
            </div>
          </div>
        )}

        {/* Bishopric Decision Form */}
        {isBishopric && (
          <div className="atv-popup-decision">
            <label className="atv-comment-label">Comentário para a organização</label>
            <textarea
              className="atv-textarea"
              rows={3}
              value={decisionComment}
              onChange={e => setDecisionComment(e.target.value)}
              placeholder="Ex.: Aprovado. Lembrem de reservar a capela até sexta."
            />

            {/* Email notification recipient details */}
            <div style={{ margin: '6px 0 10px 0', fontSize: '11.5px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✉️ Notificar: <b>{customRecipientEmail || selectedAtv.solicitante?.email || selectedAtv.responsavel || 'Sem e-mail'}</b></span>
              <button
                type="button"
                className="atv-btn-link"
                style={{ fontSize: '11.5px' }}
                onClick={() => setShowEmailEdit(!showEmailEdit)}
              >
                {showEmailEdit ? 'Ocultar' : 'Alterar e-mail'}
              </button>
            </div>

            {showEmailEdit && (
              <div style={{ marginBottom: 10 }}>
                <input
                  type="email"
                  className="inp"
                  style={{ fontSize: '12.5px', padding: '6px 10px' }}
                  value={customRecipientEmail}
                  onChange={e => setCustomRecipientEmail(e.target.value)}
                  placeholder="e-mail para notificação"
                />
              </div>
            )}

            <label className="atv-chk-agenda">
              <input
                type="checkbox"
                checked={addToAgenda}
                onChange={e => setAddToAgenda(e.target.checked)}
              />
              Incluir na Agenda da ala ao aprovar
            </label>

            <div className="atv-popup-actions">
              <button
                type="button"
                className="atv-btn-approve"
                disabled={submittingDecision}
                onClick={() => onDecide('aprovada')}
              >
                Aprovar
              </button>
              <button
                type="button"
                className="atv-btn-adjust"
                disabled={submittingDecision}
                onClick={() => onDecide('ajustes')}
              >
                Pedir ajustes
              </button>
              <button
                type="button"
                className="atv-btn-reject"
                disabled={submittingDecision}
                onClick={() => onDecide('recusada')}
              >
                Não aprovar
              </button>
            </div>
          </div>
        )}

        {/* Popup Footer Links */}
        <div className="atv-popup-footer">
          <div className="atv-popup-links-row">
            {canWrite && (
              <button
                type="button"
                className="atv-btn-link"
                onClick={() => onEdit(selectedAtv)}
              >
                Editar solicitação
              </button>
            )}

            <button
              type="button"
              className="atv-btn-link"
              onClick={onClose}
            >
              Fechar
            </button>

            {st === 'aprovada' && canWrite && (
              <button
                type="button"
                className="atv-btn-link"
                style={{ color: '#10b981', fontWeight: 600 }}
                onClick={() => onOpenFeedback(selectedAtv)}
              >
                Enviar feedback da atividade
              </button>
            )}
          </div>

          {canWrite && (
            <div>
              <button
                type="button"
                className="atv-btn-danger-link"
                onClick={() => onDelete(selectedAtv)}
              >
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
