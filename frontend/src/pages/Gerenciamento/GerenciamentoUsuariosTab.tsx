import React, { useState } from 'react';
import { UserProfile, UserRole } from '../../types';
import { api } from '../../api/client';
import { isSystemAdminUid } from '../../context/AuthContext';
import { IconCheck, IconTrash, IconEdit, IconShield, IconSearch } from '../../components/Icons';
import { ORGANIZACOES_ALA } from './gerenciamentoConstants';

interface GerenciamentoUsuariosTabProps {
  usuarios: UserProfile[];
  loading: boolean;
  currentUserUid?: string;
  onRefresh: () => void;
  onSelectUserForPermissions: (user: UserProfile) => void;
}

export const GerenciamentoUsuariosTab: React.FC<GerenciamentoUsuariosTabProps> = ({
  usuarios,
  loading,
  currentUserUid,
  onRefresh,
  onSelectUserForPermissions,
}) => {
  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState<string>('todos');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [salvandoUid, setSalvandoUid] = useState<string | null>(null);

  const pendentesCount = usuarios.filter(u => u.statusAcesso === 'pendente').length;

  const usuariosFiltrados = usuarios.filter(u => {
    if (filtroRole === 'pendentes') {
      if (u.statusAcesso !== 'pendente') return false;
    } else if (filtroRole !== 'todos') {
      if (u.role !== filtroRole) return false;
    }

    if (busca) {
      const b = busca.toLowerCase();
      const matchNome = (u.displayName || u.name || '').toLowerCase().includes(b);
      const matchEmail = (u.email || '').toLowerCase().includes(b);
      const matchCargo = (u.cargo || '').toLowerCase().includes(b);
      const matchOrg = (u.organizacao || '').toLowerCase().includes(b);
      if (!matchNome && !matchEmail && !matchCargo && !matchOrg) return false;
    }
    return true;
  });

  const handleToggleAtivo = async (u: UserProfile) => {
    const nextAtivo = u.ativo === false ? true : false;
    try {
      setSalvandoUid(u.uid);
      await api.put(`/api/auth/users/${u.uid}`, {
        ativo: nextAtivo,
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status do usuário.');
    } finally {
      setSalvandoUid(null);
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setSalvandoUid(editingUser.uid);
      await api.put(`/api/auth/users/${editingUser.uid}`, {
        displayName: editingUser.displayName,
        role: editingUser.role,
        cargo: editingUser.cargo,
        organizacao: editingUser.organizacao,
        canWrite: editingUser.canWrite,
        ativo: editingUser.ativo,
        statusAcesso: editingUser.statusAcesso,
        receberNotificacoesCadastro: editingUser.receberNotificacoesCadastro,
      });
      setEditingUser(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar dados do usuário.');
    } finally {
      setSalvandoUid(null);
    }
  };

  const handleExcluirUsuario = async (u: UserProfile) => {
    const nome = u.displayName || u.email || 'usuário';
    if (!confirm(`Tem certeza que deseja excluir o usuário "${nome}"?\n\nEsta ação removerá o acesso desta pessoa ao sistema Ala Bosque.`)) {
      return;
    }

    try {
      setSalvandoUid(u.uid);
      await api.delete(`/api/auth/users/${u.uid}`);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir usuário.');
    } finally {
      setSalvandoUid(null);
    }
  };

  const getInitials = (u: UserProfile) => {
    const n = u.displayName || u.name || u.email || 'U';
    const parts = n.split(/[\s.@_-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  // Check if editing user has management write permission (required to receive registration notifications)
  const editingUserHasMgmtWrite = Boolean(
    editingUser &&
      (editingUser.role === 'bispado' ||
        editingUser.isBishopric ||
        editingUser.permissoes?.gerenciamento === 'write' ||
        editingUser.permissoes?.gerenciamento === true)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Pending Approval Alert Banner */}
      {pendentesCount > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.15) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 12,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.4rem' }}>🔔</span>
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.94rem' }}>
                Há {pendentesCount} {pendentesCount === 1 ? 'novo líder aguardando' : 'novos líderes aguardando'} aprovação de cadastro e definição de permissões!
              </div>
              <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: 2 }}>
                Novos cadastros possuem zero permissões por padrão até que um administrador aprove e configure seus módulos.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn sm"
            onClick={() => setFiltroRole('pendentes')}
            style={{
              background: '#d97706',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '8px 14px',
              borderRadius: 8,
            }}
          >
            Ver Pendentes ({pendentesCount})
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260, maxWidth: 440 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              className="input"
              placeholder="Buscar por nome, e-mail, cargo ou organização..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ width: '100%', paddingLeft: 34 }}
            />
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
              <IconSearch size={16} />
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${filtroRole === 'todos' ? 'btn-primary' : 'btn-secondary'} sm`}
            onClick={() => setFiltroRole('todos')}
          >
            Todos ({usuarios.length})
          </button>

          {pendentesCount > 0 && (
            <button
              type="button"
              className={`btn sm`}
              onClick={() => setFiltroRole('pendentes')}
              style={{
                background: filtroRole === 'pendentes' ? '#d97706' : 'rgba(245, 158, 11, 0.15)',
                color: filtroRole === 'pendentes' ? '#fff' : '#b45309',
                borderColor: '#d97706',
                fontWeight: 600,
              }}
            >
              ⏳ Pendentes ({pendentesCount})
            </button>
          )}

          <button
            type="button"
            className={`btn ${filtroRole === 'bispado' ? 'btn-primary' : 'btn-secondary'} sm`}
            onClick={() => setFiltroRole('bispado')}
          >
            Bispado ({usuarios.filter(u => u.role === 'bispado').length})
          </button>
          <button
            type="button"
            className={`btn ${filtroRole === 'lider_org' ? 'btn-primary' : 'btn-secondary'} sm`}
            onClick={() => setFiltroRole('lider_org')}
          >
            Líderes de Org ({usuarios.filter(u => u.role === 'lider_org').length})
          </button>
          <button
            type="button"
            className={`btn ${filtroRole === 'conselho' ? 'btn-primary' : 'btn-secondary'} sm`}
            onClick={() => setFiltroRole('conselho')}
          >
            Conselho ({usuarios.filter(u => u.role === 'conselho').length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Carregando lista de usuários do sistema...
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            {busca || filtroRole !== 'todos'
              ? 'Nenhum usuário corresponde aos filtros selecionados.'
              : 'Nenhum usuário cadastrado no momento.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg, #f8fafc)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Usuário</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Papel no Sistema / Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Cargo Informado</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Organização</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Avisos E-mail</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Acesso</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map(u => {
                  const isCurrent = u.uid === currentUserUid;
                  const isSavingThis = salvandoUid === u.uid;
                  const isAtivo = u.ativo !== false;
                  const isPendente = u.statusAcesso === 'pendente';

                  return (
                    <tr
                      key={u.uid}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background-color 0.15s ease',
                        background: isPendente ? 'rgba(245, 158, 11, 0.04)' : undefined,
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: isPendente
                                ? '#d97706'
                                : u.role === 'bispado'
                                ? 'var(--bisp, #24477a)'
                                : u.role === 'lider_org'
                                ? '#8b5cf6'
                                : '#64748b',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(u)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              {u.displayName || u.name || 'Sem nome'}
                              {isSystemAdminUid(u.uid) && (
                                <span className="badge badge-warning" style={{ fontSize: '0.68rem', padding: '2px 6px', fontWeight: 700 }} title="Conta Master do Sistema (Protegida)">
                                  👑 Sistema
                                </span>
                              )}
                              {isCurrent && (
                                <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                                  Você
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                              {u.email || '—'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', opacity: 0.85, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>UID:</span>
                              <code style={{ background: 'var(--color-bg, #f1f5f9)', padding: '1px 5px', borderRadius: 4, userSelect: 'all' }}>{u.uid}</code>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                          {isPendente ? (
                            <span
                              className="badge"
                              style={{
                                background: 'rgba(245, 158, 11, 0.18)',
                                color: '#b45309',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                fontWeight: 700,
                              }}
                            >
                              ⏳ Pendente
                            </span>
                          ) : (
                            <span className={`badge ${u.role === 'bispado' ? 'badge-primary' : u.role === 'lider_org' ? 'badge-info' : ''}`}>
                              {u.role === 'bispado' ? 'Bispado' : u.role === 'lider_org' ? 'Líder de Org' : 'Conselho da Ala'}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', fontWeight: 500 }}>
                        {u.cargo || '—'}
                      </td>

                      <td style={{ padding: '14px 16px', color: 'var(--color-text-muted)' }}>
                        {u.organizacao || '—'}
                      </td>

                      {/* Notificações de novos cadastros */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {u.receberNotificacoesCadastro ? (
                          <span
                            title="Recebe e-mails de novos pedidos de cadastro"
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#15803d',
                              background: '#dcfce7',
                              padding: '2px 8px',
                              borderRadius: 999,
                            }}
                          >
                            ✉️ Ativo
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleAtivo(u)}
                          disabled={isCurrent || isSystemAdminUid(u.uid) || isSavingThis}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: (isCurrent || isSystemAdminUid(u.uid)) ? 'default' : 'pointer',
                            background: isAtivo ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isAtivo ? '#16a34a' : '#dc2626',
                          }}
                          title={isSystemAdminUid(u.uid) ? 'Conta Master do Sistema (não pode ser desativada)' : isCurrent ? 'Você não pode desativar seu próprio acesso' : 'Clique para alternar o status ativo/inativo'}
                        >
                          {isAtivo ? '● Ativo' : '○ Inativo'}
                        </button>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {isPendente ? (
                            <button
                              type="button"
                              className="btn btn-primary sm"
                              onClick={() => onSelectUserForPermissions(u)}
                              title="Aprovar e configurar permissões granulares deste usuário"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                            >
                              <IconCheck size={14} /> Aprovar & Liberar
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-secondary sm"
                              onClick={() => onSelectUserForPermissions(u)}
                              title="Ajustar permissões granulares deste usuário"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <IconShield size={14} /> Permissões
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-secondary sm"
                            onClick={() => setEditingUser({ ...u })}
                            title="Editar dados cadastrais"
                          >
                            <IconEdit size={14} />
                          </button>

                          {!isCurrent && (
                            <button
                              type="button"
                              className="btn btn-secondary sm"
                              onClick={() => handleExcluirUsuario(u)}
                              style={{ color: 'var(--color-danger, #dc2626)' }}
                              title="Excluir usuário"
                            >
                              <IconTrash size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal" onClick={() => setEditingUser(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div
            className="sheet"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 520,
              background: 'var(--color-surface, #fff)',
              borderRadius: 'var(--radius, 12px)',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 12, marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Editar Perfil do Usuário</h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label" style={{ fontSize: '0.78rem', marginBottom: 4, display: 'block' }}>
                  Identificador Único (UID)
                </label>
                <input
                  type="text"
                  className="input"
                  value={editingUser.uid}
                  disabled
                  style={{ width: '100%', opacity: 0.7, fontFamily: 'monospace', fontSize: '0.82rem', background: 'var(--color-bg, #f1f5f9)' }}
                />
              </div>

              <div>
                <label className="label" style={{ fontSize: '0.78rem', marginBottom: 4, display: 'block' }}>
                  Nome de Exibição
                </label>
                <input
                  type="text"
                  className="input"
                  value={editingUser.displayName || ''}
                  onChange={e => setEditingUser(prev => prev ? { ...prev, displayName: e.target.value } : null)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="label" style={{ fontSize: '0.78rem', marginBottom: 4, display: 'block' }}>
                  E-mail institucional
                </label>
                <input
                  type="text"
                  className="input"
                  value={editingUser.email || ''}
                  disabled
                  style={{ width: '100%', opacity: 0.65 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label" style={{ fontSize: '0.78rem', marginBottom: 4, display: 'block' }}>
                    Papel Geral
                  </label>
                  <select
                    className="input"
                    value={editingUser.role}
                    onChange={e => setEditingUser(prev => prev ? { ...prev, role: e.target.value as UserRole, isBishopric: e.target.value === 'bispado' } : null)}
                    style={{ width: '100%' }}
                  >
                    <option value="bispado">Bispado</option>
                    <option value="lider_org">Líder de Organização</option>
                    <option value="conselho">Conselho da Ala</option>
                  </select>
                </div>

                <div>
                  <label className="label" style={{ fontSize: '0.78rem', marginBottom: 4, display: 'block' }}>
                    Organização
                  </label>
                  <select
                    className="input"
                    value={editingUser.organizacao || 'Sociedade de Socorro'}
                    onChange={e => setEditingUser(prev => prev ? { ...prev, organizacao: e.target.value } : null)}
                    style={{ width: '100%' }}
                  >
                    {ORGANIZACOES_ALA.map(org => (
                      <option key={org} value={org}>{org}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label" style={{ fontSize: '0.78rem', marginBottom: 4, display: 'block' }}>
                  Cargo / Chamado Oficial
                </label>
                <input
                  type="text"
                  className="input"
                  value={editingUser.cargo || ''}
                  onChange={e => setEditingUser(prev => prev ? { ...prev, cargo: e.target.value } : null)}
                  placeholder="Ex: 1ª Conselheira da Sociedade de Socorro"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label" style={{ fontSize: '0.78rem', marginBottom: 4, display: 'block' }}>
                    Status de Acesso
                  </label>
                  <select
                    className="input"
                    value={editingUser.statusAcesso || 'aprovado'}
                    onChange={e => setEditingUser(prev => prev ? { ...prev, statusAcesso: e.target.value as any } : null)}
                    style={{ width: '100%' }}
                  >
                    <option value="aprovado">Aprovado (Ativo)</option>
                    <option value="pendente">Pendente de Aprovação</option>
                    <option value="recusado">Recusado</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer', marginTop: 16 }}>
                    <input
                      type="checkbox"
                      checked={editingUser.canWrite !== false}
                      onChange={e => setEditingUser(prev => prev ? { ...prev, canWrite: e.target.checked } : null)}
                    />
                    Permitir Escrita (canWrite)
                  </label>
                </div>
              </div>

              {/* Opção requerida: "Usuário recebe pedidos de novo cadastro?" */}
              <div
                style={{
                  background: 'var(--color-bg, #f8fafc)',
                  border: '1px solid var(--color-border, #e2e8f0)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  marginTop: 4,
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    cursor: editingUserHasMgmtWrite ? 'pointer' : 'not-allowed',
                    opacity: editingUserHasMgmtWrite ? 1 : 0.65,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editingUser.receberNotificacoesCadastro === true && editingUserHasMgmtWrite}
                    disabled={!editingUserHasMgmtWrite}
                    onChange={e =>
                      setEditingUser(prev => (prev ? { ...prev, receberNotificacoesCadastro: e.target.checked } : null))
                    }
                    style={{ marginTop: 3 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text)' }}>
                      Usuário recebe pedidos de novo cadastro por e-mail?
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                      {editingUserHasMgmtWrite
                        ? 'Quando ativado, este líder receberá um e-mail via SMTP para cada nova solicitação de cadastro/permissão.'
                        : 'Disponível apenas para líderes que possuam permissão de escrita/edição no módulo de Gerenciamento.'}
                    </div>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={salvandoUid === editingUser.uid}>
                  {salvandoUid === editingUser.uid ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
