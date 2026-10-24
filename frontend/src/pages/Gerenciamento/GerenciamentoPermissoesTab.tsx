import React, { useState, useEffect } from 'react';
import { UserProfile, UserPermissions, PermissionLevel } from '../../types';
import { api } from '../../api/client';
import { isSystemAdminUid } from '../../context/AuthContext';
import { IconCheck, IconShield, IconSparkles } from '../../components/Icons';
import { MODULOS_GERENCIAMENTO, PRESETS_PERMISSOES } from './gerenciamentoConstants';

interface GerenciamentoPermissoesTabProps {
  usuarios: UserProfile[];
  selectedUser: UserProfile | null;
  onSelectUser: (user: UserProfile) => void;
  onRefresh: () => void;
}

export const GerenciamentoPermissoesTab: React.FC<GerenciamentoPermissoesTabProps> = ({
  usuarios,
  selectedUser,
  onSelectUser,
  onRefresh,
}) => {
  const [activeUser, setActiveUser] = useState<UserProfile | null>(selectedUser || (usuarios.length > 0 ? usuarios[0] : null));
  const [localPerms, setLocalPerms] = useState<UserPermissions>({});
  const [salvando, setSalvando] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);

  useEffect(() => {
    if (selectedUser) {
      setActiveUser(selectedUser);
    } else if (!activeUser && usuarios.length > 0) {
      setActiveUser(usuarios[0]);
    }
  }, [selectedUser, usuarios]);

  useEffect(() => {
    if (activeUser) {
      // Normalize permissions
      const initial: UserPermissions = {};
      const current = activeUser.permissoes || {};
      MODULOS_GERENCIAMENTO.forEach(m => {
        const val = current[m.id];
        if (val === true || val === 'write') {
          initial[m.id] = 'write';
        } else if (val === 'read') {
          initial[m.id] = 'read';
        } else {
          initial[m.id] = 'none';
        }
      });
      setLocalPerms(initial);
    }
  }, [activeUser]);

  const handleUserChange = (uid: string) => {
    const found = usuarios.find(u => u.uid === uid);
    if (found) {
      setActiveUser(found);
      onSelectUser(found);
    }
  };

  const handleSetPerm = (moduloId: keyof UserPermissions, level: PermissionLevel) => {
    setLocalPerms(prev => ({
      ...prev,
      [moduloId]: level,
    }));
  };

  const aplicarPreset = (presetKey: string) => {
    const preset = PRESETS_PERMISSOES[presetKey];
    if (!preset) return;

    setLocalPerms({ ...preset.permissoes });
    setMsgSucesso(`Preset "${preset.label}" aplicado! Clique no botão abaixo para confirmar.`);
    setTimeout(() => setMsgSucesso(null), 4000);
  };

  const isPending = activeUser?.statusAcesso === 'pendente';

  const handleSalvar = async () => {
    if (!activeUser) return;

    try {
      setSalvando(true);
      const hasAnyWrite = Object.values(localPerms).some(v => v === 'write');

      await api.put(`/api/auth/users/${activeUser.uid}`, {
        permissoes: localPerms,
        statusAcesso: isPending ? 'aprovado' : activeUser.statusAcesso,
        canWrite: hasAnyWrite,
      });

      setMsgSucesso(
        isPending
          ? `Acesso aprovado com sucesso para ${activeUser.displayName || activeUser.email}! E-mail de confirmação enviado.`
          : `Permissões de ${activeUser.displayName || activeUser.email} salvas com sucesso!`
      );
      setTimeout(() => setMsgSucesso(null), 5000);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar permissões granulares.');
    } finally {
      setSalvando(false);
    }
  };

  if (usuarios.length === 0) {
    return (
      <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Nenhum usuário cadastrado no sistema para configurar permissões.
      </div>
    );
  }

  // Suggest preset based on activeUser cargo / organizacao
  const getSuggestedPreset = (): string | null => {
    if (!activeUser) return null;
    const c = (activeUser.cargo || '').toLowerCase();
    const o = (activeUser.organizacao || '').toLowerCase();
    if (c.includes('bispo') || c.includes('bispado')) return 'bispado';
    if (c.includes('secret') || o.includes('secret')) return 'secretario';
    if (c.includes('presid') || c.includes('conselh') || o.includes('socorro') || o.includes('prim') || o.includes('moç') || o.includes('rapaz')) return 'lider_org';
    return 'conselho';
  };

  const suggestedPreset = getSuggestedPreset();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top selection card */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <label className="label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Selecione o Líder / Usuário para Ajustar Permissões:
            </label>
            <select
              className="input"
              value={activeUser?.uid || ''}
              onChange={e => handleUserChange(e.target.value)}
              style={{ width: '100%', maxWidth: 460, fontWeight: 600 }}
            >
              {usuarios.map(u => (
                <option key={u.uid} value={u.uid}>
                  {u.uid && isSystemAdminUid(u.uid) ? '👑 [SISTEMA] ' : u.statusAcesso === 'pendente' ? '⏳ [PENDENTE] ' : ''}
                  {u.displayName || u.name || u.email} ({u.cargo || u.role}) • UID: {u.uid}
                </option>
              ))}
            </select>
          </div>

          {activeUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                  {activeUser.displayName || activeUser.email}
                  {isSystemAdminUid(activeUser.uid) && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(234, 179, 8, 0.2)',
                        color: '#a16207',
                        fontWeight: 700,
                      }}
                    >
                      👑 Conta do Sistema
                    </span>
                  )}
                  {isPending && !isSystemAdminUid(activeUser.uid) && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(245, 158, 11, 0.18)',
                        color: '#b45309',
                        fontWeight: 700,
                      }}
                    >
                      Pendente
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Papel: <strong>{activeUser.role}</strong> {activeUser.organizacao ? `• ${activeUser.organizacao}` : ''}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', marginTop: 3 }}>
                  UID: <code style={{ background: 'var(--color-bg, #f1f5f9)', padding: '1px 5px', borderRadius: 4, userSelect: 'all' }}>{activeUser.uid}</code>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSalvar}
                disabled={salvando}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: isPending ? '#16a34a' : undefined,
                  borderColor: isPending ? '#16a34a' : undefined,
                  fontWeight: 600,
                }}
              >
                <IconCheck size={16} color="#fff" />
                {salvando ? 'Salvando...' : isPending ? 'Aprovar Acesso & Salvar' : 'Salvar Permissões'}
              </button>
            </div>
          )}
        </div>

        {/* Pending Request Details Banner */}
        {isPending && activeUser && (
          <div
            style={{
              marginTop: 16,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.14) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 10,
              padding: '14px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>⏳</span> Solicitação de Cadastro e Acesso Pendente
                </div>
                <div style={{ fontSize: '0.84rem', color: '#78350f', marginTop: 4 }}>
                  <strong>Chamado informado:</strong> {activeUser.solicitacaoAcesso?.cargo || activeUser.cargo || 'Não informado'}
                  {activeUser.solicitacaoAcesso?.organizacao || activeUser.organizacao
                    ? ` • Organização: ${activeUser.solicitacaoAcesso?.organizacao || activeUser.organizacao}`
                    : ''}
                </div>
                {activeUser.solicitacaoAcesso?.justificativa && (
                  <div style={{ fontSize: '0.82rem', color: '#92400e', marginTop: 6, fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.6)', padding: '6px 10px', borderRadius: 6 }}>
                    "{activeUser.solicitacaoAcesso.justificativa}"
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.78rem', color: '#b45309', alignSelf: 'center' }}>
                💡 Defina as permissões abaixo e clique em <strong>Aprovar Acesso & Salvar</strong> para liberar a conta.
              </div>
            </div>
          </div>
        )}

        {msgSucesso && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(34, 197, 94, 0.12)',
              color: '#15803d',
              fontSize: '0.88rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <IconCheck size={16} color="#15803d" />
            {msgSucesso}
          </div>
        )}
      </div>

      {/* 1-Click Preset Bar */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconSparkles size={18} color="var(--color-primary)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Presets Rápidos de Permissão:</span>
            {suggestedPreset && (
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginLeft: 4 }}>
                (Sugerido para este líder: <strong>{PRESETS_PERMISSOES[suggestedPreset]?.label}</strong>)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn sm ${suggestedPreset === 'bispado' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => aplicarPreset('bispado')}
              title="Acesso total de escrita a todos os módulos"
            >
              🏛️ Preset Bispado
            </button>
            <button
              type="button"
              className={`btn sm ${suggestedPreset === 'secretario' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => aplicarPreset('secretario')}
              title="Escrita em atas, reuniões, membros e agenda; leitura no financeiro"
            >
              📝 Preset Secretário
            </button>
            <button
              type="button"
              className={`btn sm ${suggestedPreset === 'lider_org' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => aplicarPreset('lider_org')}
              title="Acesso a atividades, designações e mural; leitura de membros"
            >
              🤝 Preset Líder de Org
            </button>
            <button
              type="button"
              className={`btn sm ${suggestedPreset === 'conselho' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => aplicarPreset('conselho')}
              title="Leitura em mural, reuniões, agenda e atas"
            >
              👥 Preset Conselho da Ala
            </button>
          </div>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Matriz de Permissões Granulares por Módulo</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Defina com precisão o que este líder pode apenas visualizar ou também criar, editar e excluir.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} /> Sem Acesso
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308' }} /> Somente Leitura
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} /> Leitura e Escrita
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 18px', width: '35%' }}>Módulo do Sistema</th>
                <th style={{ padding: '12px 18px', width: '25%' }}>Categoria</th>
                <th style={{ padding: '12px 18px', textAlign: 'right', width: '40%' }}>Nível de Permissão</th>
              </tr>
            </thead>
            <tbody>
              {MODULOS_GERENCIAMENTO.map(m => {
                const currentLevel: PermissionLevel = (localPerms[m.id] as PermissionLevel) || 'none';

                return (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                        {m.nome}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {m.descricao}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span className="badge" style={{ fontSize: '0.75rem' }}>
                        {m.categoria}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          borderRadius: 8,
                          border: '1px solid var(--color-border)',
                          overflow: 'hidden',
                          background: 'var(--color-surface-hover)',
                        }}
                      >
                        {/* None */}
                        <button
                          type="button"
                          onClick={() => handleSetPerm(m.id, 'none')}
                          style={{
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            background: currentLevel === 'none' ? '#ef4444' : 'transparent',
                            color: currentLevel === 'none' ? '#fff' : 'var(--color-text-muted)',
                          }}
                          title="Sem acesso: módulo bloqueado e oculto"
                        >
                          🔴 Sem Acesso
                        </button>

                        {/* Read */}
                        <button
                          type="button"
                          onClick={() => handleSetPerm(m.id, 'read')}
                          style={{
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            background: currentLevel === 'read' ? '#eab308' : 'transparent',
                            color: currentLevel === 'read' ? '#000' : 'var(--color-text-muted)',
                            borderLeft: '1px solid var(--color-border)',
                            borderRight: '1px solid var(--color-border)',
                          }}
                          title="Somente leitura: visualiza sem editar ou excluir"
                        >
                          🟡 Leitura
                        </button>

                        {/* Write */}
                        <button
                          type="button"
                          onClick={() => handleSetPerm(m.id, 'write')}
                          style={{
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            background: currentLevel === 'write' ? '#22c55e' : 'transparent',
                            color: currentLevel === 'write' ? '#fff' : 'var(--color-text-muted)',
                          }}
                          title="Leitura e escrita: acesso irrestrito ao módulo"
                        >
                          🟢 Escrita Total
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '16px 20px', background: 'var(--color-surface-hover)', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSalvar}
            disabled={salvando}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: isPending ? '#16a34a' : undefined,
              borderColor: isPending ? '#16a34a' : undefined,
              fontWeight: 600,
            }}
          >
            <IconCheck size={16} color="#fff" />
            {salvando ? 'Salvando alterações...' : isPending ? 'Aprovar Acesso & Salvar' : 'Salvar Permissões'}
          </button>
        </div>
      </div>
    </div>
  );
};
