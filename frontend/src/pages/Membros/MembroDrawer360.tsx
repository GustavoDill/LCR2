import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Membro, MembroProfile360 } from '../../types';
import { CH_FLOW, D_FLOW } from './membrosConstants';
import { ageGroup, ageOf } from './membrosUtils';

interface MembroDrawer360Props {
  drawerMember: Membro | null;
  onClose: () => void;
  profile360: MembroProfile360 | null;
  loading360: boolean;
  canWrite: boolean;
  onEditMember: (m: Membro) => void;
  onToggleTaskStatus: (taskId: string, currentStatus: string, origem: 'bispado' | 'conselho') => void;
  onAddQuickTask: (titulo: string) => void;
}

export const MembroDrawer360: React.FC<MembroDrawer360Props> = ({
  drawerMember,
  onClose,
  profile360,
  loading360,
  canWrite,
  onEditMember,
  onToggleTaskStatus,
  onAddQuickTask,
}) => {
  const navigate = useNavigate();
  const [quickTaskTitulo, setQuickTaskTitulo] = useState('');
  const [isAddingQuickTask, setIsAddingQuickTask] = useState(false);

  if (!drawerMember) return null;

  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitulo.trim()) return;
    onAddQuickTask(quickTaskTitulo.trim());
    setQuickTaskTitulo('');
    setIsAddingQuickTask(false);
  };

  const memberAge = ageOf(drawerMember);
  const memberGroup = ageGroup(drawerMember);

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            title="Fechar ficha"
          >
            ✕
          </button>

          <div className="drawer-profile-top">
            <div className={`drawer-avatar ${drawerMember.sexo === 'F' ? 'fem' : ''}`}>
              {drawerMember.nome
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map(p => p[0].toUpperCase())
                .join('')}
            </div>

            <div className="drawer-user-info">
              <h3>{drawerMember.nome}</h3>
              {drawerMember.nomeOriginal && drawerMember.nomeOriginal !== drawerMember.nome && (
                <div className="sub-name">Nome original: {drawerMember.nomeOriginal}</div>
              )}
              <div className="drawer-chips">
                {memberAge != null && (
                  <span className="drawer-chip highlight">{memberAge} anos</span>
                )}
                {drawerMember.sexo && (
                  <span className="drawer-chip">
                    {drawerMember.sexo === 'M' ? 'Masculino' : 'Feminino'}
                  </span>
                )}
                <span className="drawer-chip">
                  {memberGroup === 'adultos'
                    ? 'Adulto'
                    : memberGroup === 'jovens'
                    ? 'Jovem'
                    : 'Criança'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Contact Bar */}
          <div className="drawer-contact-bar">
            {drawerMember.telefone && (
              <>
                <a
                  href={`tel:${drawerMember.telefone.replace(/\D/g, '')}`}
                  className="contact-action-btn"
                >
                  📞 Ligar
                </a>
                <a
                  href={`https://wa.me/55${drawerMember.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá, ${drawerMember.nome.split(' ')[0]}!`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-action-btn whatsapp"
                >
                  💬 WhatsApp
                </a>
              </>
            )}
            {drawerMember.email && (
              <a href={`mailto:${drawerMember.email}`} className="contact-action-btn">
                ✉️ E-mail
              </a>
            )}
          </div>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {loading360 ? (
            <div className="empty" style={{ margin: 'auto' }}>
              Carregando ficha 360° do membro…
            </div>
          ) : (
            <>
              {/* 1. Chamados Atuais */}
              <div className="drawer-section">
                <div className="drawer-section-title">
                  <span>Chamados Ativos na Ala</span>
                  <span className="count-badge">
                    {profile360?.chamadosAtivos.length || (drawerMember.chamado ? 1 : 0)}
                  </span>
                </div>

                {profile360?.chamadosAtivos && profile360.chamadosAtivos.length > 0 ? (
                  profile360.chamadosAtivos.map(c => (
                    <div key={c.cargoId} className="drawer-card drawer-card-calling">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="calling-title">👑 {c.cargoTitulo}</div>
                        <span className="badge-calling" style={{ fontSize: '10.5px' }}>Oficial</span>
                      </div>
                      <div className="calling-meta">
                        <span>📁 <b>Organização:</b> {c.suborgNome}</span>
                        {c.desde && <span>📅 <b>Desde:</b> {c.desde}</span>}
                      </div>
                      {canWrite && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <button
                            type="button"
                            className="btn ghost sm"
                            onClick={() => navigate('/chamados')}
                          >
                            Ver na lista
                          </button>
                          <button
                            type="button"
                            className="btn ghost sm"
                            style={{ color: '#f43f5e' }}
                            onClick={() =>
                              navigate(
                                `/chamados-desobrigacoes?openDesobrigar=true&pessoaNome=${encodeURIComponent(
                                  drawerMember.nome
                                )}&cargo=${encodeURIComponent(c.cargoTitulo)}&orgId=${c.suborgId}&cargoId=${c.cargoId}`
                              )
                            }
                          >
                            Desobrigar
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : drawerMember.chamado?.trim() ? (
                  <div className="drawer-card drawer-card-calling">
                    <div className="calling-title">📋 {drawerMember.chamado}</div>
                    <div className="calling-meta">
                      <span>(Registrado no cadastro importado)</span>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state-card">
                    Nenhum chamado ativo no momento. Membro disponível para novas indicações.
                  </div>
                )}
              </div>

              {/* 2. Processos em Andamento (Pipeline) */}
              <div className="drawer-section">
                <div className="drawer-section-title">
                  <span>Processos no Pipeline</span>
                  <span className="count-badge">
                    {profile360?.processosPipeline.length || 0}
                  </span>
                </div>

                {profile360?.processosPipeline && profile360.processosPipeline.length > 0 ? (
                  profile360.processosPipeline.map(proc => {
                    const isChamado = proc.tipo === 'chamado' && proc.detalhe !== 'Desobrigação';
                    const stages = isChamado ? CH_FLOW : D_FLOW;
                    const currentIdx = stages.indexOf(proc.detalhe);
                    const activeIdx = currentIdx >= 0 ? currentIdx : (proc.dpasso ?? 0);

                    return (
                      <div key={proc.id} className="pipeline-step-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <b style={{ fontSize: '13.5px', color: '#38bdf8' }}>
                            {isChamado ? 'Indicação de Chamado' : 'Processo de Desobrigação'}
                          </b>
                          <span className="drawer-chip highlight">{proc.detalhe || 'Em andamento'}</span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
                          <b>Cargo:</b> {proc.chamado || 'Não especificado'}
                        </div>
                        {proc.proxima && (
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            👉 <b>Próximo passo:</b> {proc.proxima} ({proc.responsavel || 'Bispo'})
                          </div>
                        )}

                        {/* Visual Stepper */}
                        <div className="pipeline-stepper">
                          {stages.map((st, sIdx) => {
                            const isDone = sIdx < activeIdx;
                            const isCur = sIdx === activeIdx;
                            return (
                              <div
                                key={st}
                                className={`stepper-node ${isDone ? 'done' : ''} ${isCur ? 'active' : ''}`}
                                title={st}
                              >
                                {isDone ? '✓' : sIdx + 1}
                              </div>
                            );
                          })}
                        </div>
                        <div className="stepper-labels">
                          <span>{stages[0]}</span>
                          <span>{stages[Math.floor(stages.length / 2)]}</span>
                          <span>{stages[stages.length - 1]}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state-card">
                    Nenhum processo de indicação ou transição em aberto para este membro.
                  </div>
                )}
              </div>

              {/* 3. Designações / Tarefas */}
              <div className="drawer-section">
                <div className="drawer-section-title">
                  <span>Designações Atribuídas</span>
                  <span className="count-badge">
                    {profile360?.designacoes.length || 0}
                  </span>
                </div>

                {profile360?.designacoes && profile360.designacoes.length > 0 ? (
                  profile360.designacoes.map(d => (
                    <div key={d.id} className={`task-item-drawer ${d.status}`}>
                      <input
                        type="checkbox"
                        className="task-checkbox"
                        checked={d.status === 'concluida'}
                        onChange={() => onToggleTaskStatus(d.id, d.status, d.origem)}
                        title="Marcar como concluída / pendente"
                      />
                      <div className="task-info">
                        <span className="task-title">{d.titulo}</span>
                        <div className="task-meta">
                          {d.prazo && <span>📅 Prazo: {d.prazo}</span>}
                          <span>📌 {d.origem === 'bispado' ? 'Bispado' : 'Conselho da Ala'}</span>
                          <span style={{ color: d.status === 'concluida' ? '#10b981' : '#f59e0b' }}>
                            {d.status === 'concluida' ? 'Concluída' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-card">
                    Nenhuma tarefa ou designação atribuída atualmente.
                  </div>
                )}

                {canWrite && !isAddingQuickTask && (
                  <button
                    type="button"
                    className="btn ghost sm"
                    style={{ alignSelf: 'flex-start', marginTop: '4px' }}
                    onClick={() => setIsAddingQuickTask(true)}
                  >
                    + Atribuir nova tarefa
                  </button>
                )}

                {canWrite && isAddingQuickTask && (
                  <form onSubmit={handleQuickTaskSubmit} style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <input
                      type="text"
                      className="inp"
                      placeholder="Título da tarefa para este membro..."
                      value={quickTaskTitulo}
                      onChange={e => setQuickTaskTitulo(e.target.value)}
                      autoFocus
                    />
                    <button type="submit" className="btn sm">Salvar</button>
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => {
                        setIsAddingQuickTask(false);
                        setQuickTaskTitulo('');
                      }}
                    >
                      Cancelar
                    </button>
                  </form>
                )}
              </div>

              {/* 4. Histórico de Chamados */}
              <div className="drawer-section">
                <div className="drawer-section-title">
                  <span>Histórico de Chamados Servidos</span>
                  <span className="count-badge">
                    {profile360?.historicoChamados.length || 0}
                  </span>
                </div>

                {profile360?.historicoChamados && profile360.historicoChamados.length > 0 ? (
                  <div className="history-timeline">
                    {profile360.historicoChamados.map((h, hIdx) => (
                      <div key={hIdx} className="history-item">
                        <div className="hist-title">{h.cargoTitulo}</div>
                        <div className="hist-sub">
                          {h.suborgNome} · {h.desde ? `de ${h.desde}` : ''} {h.ate ? `até ${h.ate}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-card">
                    Nenhum histórico anterior registrado para este membro.
                  </div>
                )}
              </div>

              {/* 5. Dados Cadastrais Adicionais */}
              <div className="drawer-section">
                <div className="drawer-section-title">
                  <span>Dados de Cadastro</span>
                </div>
                <div className="drawer-card" style={{ fontSize: '12.5px', color: '#cbd5e1', gap: '6px' }}>
                  {drawerMember.nascimento && (
                    <div>🎂 <b>Data de Nascimento:</b> {drawerMember.nascimento}</div>
                  )}
                  {drawerMember.endereco && (
                    <div>📍 <b>Endereço:</b> {drawerMember.endereco}</div>
                  )}
                  {drawerMember.obs && (
                    <div>📝 <b>Observações:</b> {drawerMember.obs}</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="drawer-footer">
          {canWrite && (
            <button
              type="button"
              className="btn bisp"
              onClick={() =>
                navigate(
                  `/chamados-desobrigacoes?openIndicar=true&pessoaNome=${encodeURIComponent(drawerMember.nome)}`
                )
              }
            >
              + Indicar para chamado
            </button>
          )}
          {canWrite && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                const m = drawerMember;
                onClose();
                onEditMember(m);
              }}
            >
              Editar cadastro
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
