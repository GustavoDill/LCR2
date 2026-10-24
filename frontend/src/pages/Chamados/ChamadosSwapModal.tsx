import React, { useEffect, useMemo, useState } from 'react';
import { Cargo, Membro, Organizacao } from '../../types';

interface ChamadosSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSubOrg: Organizacao | null;
  activeCargo: Cargo | null;
  defaultModo: 'agora' | 'processo';
  members: Membro[];
  memberCallingsMap: Record<string, string[]>;
  onSubmit: (data: {
    nome: string;
    modo: 'agora' | 'processo';
    data: string;
    titulo: string;
    desobrigarAtual: boolean;
  }) => void;
  onVagar: () => void;
  onDeleteCargo: (suborgId: string, cargoId: string, cargoTitulo: string) => void;
}

export const ChamadosSwapModal: React.FC<ChamadosSwapModalProps> = ({
  isOpen,
  onClose,
  activeSubOrg,
  activeCargo,
  defaultModo,
  members,
  memberCallingsMap,
  onSubmit,
  onVagar,
  onDeleteCargo,
}) => {
  const [swapNome, setSwapNome] = useState('');
  const [swapFilterText, setSwapFilterText] = useState('');
  const [swapModo, setSwapModo] = useState<'agora' | 'processo'>(defaultModo);
  const [swapData, setSwapData] = useState(new Date().toISOString().split('T')[0]);
  const [swapTitulo, setSwapTitulo] = useState('');
  const [desobrigarAtual, setDesobrigarAtual] = useState(true);

  useEffect(() => {
    if (!isOpen || !activeCargo) return;
    setSwapNome(activeCargo.pessoa || '');
    setSwapFilterText('');
    setSwapModo(defaultModo);
    setSwapData(new Date().toISOString().split('T')[0]);
    setSwapTitulo(activeCargo.titulo);
    setDesobrigarAtual(Boolean(activeCargo.pessoa));
  }, [isOpen, activeCargo, defaultModo]);

  const filteredMembersForSwap = useMemo(() => {
    const q = swapFilterText.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      m => m.nome.toLowerCase().includes(q) || (m.nomeOriginal && m.nomeOriginal.toLowerCase().includes(q))
    );
  }, [swapFilterText, members]);

  if (!isOpen || !activeCargo || !activeSubOrg) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      nome: swapNome,
      modo: swapModo,
      data: swapData,
      titulo: swapTitulo,
      desobrigarAtual,
    });
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <h3>
          {swapModo === 'processo'
            ? `Indicar pessoa: ${activeCargo.titulo}`
            : (!activeCargo.pessoa ? 'Preencher' : 'Trocar') + `: ${activeCargo.titulo}`}
        </h3>
        <p className="sub" style={{ marginTop: -8 }}>{activeSubOrg.nome}</p>

        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{!activeCargo.pessoa ? 'Quem vai servir' : 'Nova pessoa'}</span>
              {members.length > 0 && (
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {members.length} membros na ala
                </span>
              )}
            </label>

            <input
              className="inp"
              type="search"
              placeholder="🔍 Digite para filtrar a lista abaixo..."
              value={swapFilterText}
              onChange={e => setSwapFilterText(e.target.value)}
              style={{ marginBottom: 6, fontSize: '12.5px', padding: '6px 10px' }}
            />

            <select
              className="inp"
              value={swapNome}
              onChange={e => setSwapNome(e.target.value)}
              style={{ fontSize: '13.5px' }}
            >
              <option value="">(Nenhum)</option>
              {filteredMembersForSwap.map(m => {
                const callings = memberCallingsMap[m.nome.toLowerCase().trim()];
                const extra = callings && callings.length > 0 ? ` [⚠️ Já serve: ${callings[0]}]` : '';
                const metaParts = [
                  m.idade ? `${m.idade} anos` : '',
                  m.sexo ? (m.sexo === 'M' ? 'M' : 'F') : '',
                ].filter(Boolean).join(', ');
                return (
                  <option key={m.id} value={m.nome}>
                    {m.nome} {metaParts ? `(${metaParts})` : ''}{extra}
                  </option>
                );
              })}
            </select>

            {swapNome && (
              <div style={{ marginTop: 6, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>
                  Selecionado: <b>{swapNome}</b>
                </span>
                <button
                  type="button"
                  className="btn ghost sm"
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                  onClick={() => setSwapNome('')}
                >
                  Limpar para (Nenhum)
                </button>
              </div>
            )}

            {swapNome && memberCallingsMap[swapNome.toLowerCase().trim()] && (
              <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: '6px', background: 'rgba(217, 119, 6, 0.1)', border: '1px solid #d97706', fontSize: '12px', color: 'var(--ink)' }}>
                <strong style={{ color: '#d97706' }}>Aviso:</strong> {swapNome} já possui chamado(s): {memberCallingsMap[swapNome.toLowerCase().trim()].join(', ')}.
              </div>
            )}
          </div>

          <div className="radios" role="radiogroup">
            <label>
              <input
                type="radio"
                name="swapModo"
                value="agora"
                checked={swapModo === 'agora'}
                onChange={() => setSwapModo('agora')}
              />
              <span>
                <b>Já foi apoiado</b>
                <small style={{ display: 'block', color: 'var(--muted)' }}>
                  Registra a pessoa no chamado imediatamente.
                </small>
              </span>
            </label>

            <label>
              <input
                type="radio"
                name="swapModo"
                value="processo"
                checked={swapModo === 'processo'}
                onChange={() => setSwapModo('processo')}
              />
              <span>
                <b>Iniciar o processo de chamado</b>
                <small style={{ display: 'block', color: 'var(--muted)' }}>
                  Entra no fluxo de indicação, entrevista, apoio e designação.
                </small>
              </span>
            </label>
          </div>

          <div className="field" style={{ maxWidth: 200 }}>
            <label>A partir de</label>
            <input
              className="inp"
              type="date"
              value={swapData}
              onChange={e => setSwapData(e.target.value)}
            />
          </div>

          {activeCargo.pessoa && swapModo === 'processo' && (
            <label className="chk">
              <input
                type="checkbox"
                checked={desobrigarAtual}
                onChange={e => setDesobrigarAtual(e.target.checked)}
              />
              Criar lembrete para desobrigar {activeCargo.pessoa}
            </label>
          )}

          {activeCargo.historico && activeCargo.historico.length > 0 && (
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
              <span className="lbl">Histórico de ocupantes anteriores</span>
              <div className="list" style={{ marginTop: 6 }}>
                {activeCargo.historico.map((h, i) => (
                  <div key={i} className="row" style={{ padding: '4px 0' }}>
                    <span style={{ fontWeight: 600 }}>{h.pessoa}</span>
                    <span className="row-m">
                      {h.desde ? `${h.desde} – ` : ''}
                      {h.ate || 'atual'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="foot">
            <div className="btns">
              <button type="submit" className="btn pri">
                Salvar
              </button>
              <button type="button" className="btn ghost" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn ghost danger"
                onClick={() => onDeleteCargo(activeSubOrg.id, activeCargo.id, activeCargo.titulo)}
              >
                Excluir chamado
              </button>
            </div>
            {activeCargo.pessoa && (
              <button type="button" className="btn ghost danger" onClick={onVagar}>
                Deixar vago
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
