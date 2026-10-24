import React from 'react';
import { UserProfile, UserRole } from '../../types';
import { getDefaultPermissions } from '../../context/AuthContext';
import { IconCheck, IconTrash, Icon } from '../../components/Icons';
import { ORGANIZACOES_ALA } from './importarConstants';

interface ImportarUsersTableProps {
  usuarios: UserProfile[];
  loadingUsuarios: boolean;
  currentUserUid?: string;
  savingUid: string | null;
  msgSucessoPerm: string | null;
  onRefresh: () => void;
  onUpdateUser: (uid: string, updates: Partial<UserProfile>) => void;
  onSaveUser: (u: UserProfile) => void;
  onDeleteUser: (uid: string, nome: string) => void;
  onOpenPermissionsModal: (u: UserProfile) => void;
}

export const ImportarUsersTable: React.FC<ImportarUsersTableProps> = ({
  usuarios,
  loadingUsuarios,
  currentUserUid,
  savingUid,
  msgSucessoPerm,
  onRefresh,
  onUpdateUser,
  onSaveUser,
  onDeleteUser,
  onOpenPermissionsModal,
}) => {
  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Gestão de Líderes e Permissões de Acesso</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Defina o papel (<strong>Bispado</strong>, <strong>Líder de Org</strong> ou <strong>Conselho</strong>) e ajuste individualmente cada módulo que o líder pode ver e operar.
          </p>
        </div>
        <button className="btn btn-secondary sm" onClick={onRefresh} disabled={loadingUsuarios}>
          {loadingUsuarios ? 'Atualizando...' : 'Atualizar Lista'}
        </button>
      </div>

      {msgSucessoPerm && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius)',
            background: '#e6f4ea',
            color: '#137333',
            fontSize: '0.85rem',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <IconCheck size={16} />
          {msgSucessoPerm}
        </div>
      )}

      {loadingUsuarios ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Carregando lista de líderes cadastrados...
        </div>
      ) : usuarios.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Nenhum outro líder cadastrado ainda. Quando criarem conta ou fizerem login com Google, eles aparecerão aqui.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nome / E-mail</th>
                <th>Nível de Papel</th>
                <th>Organização / Chamado</th>
                <th style={{ textAlign: 'center' }}>Edição?</th>
                <th>Status</th>
                <th>Permissões Específicas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => {
                const isSelf = currentUserUid === u.uid;
                const role = u.role || 'conselho';

                return (
                  <tr key={u.uid}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.displayName || 'Sem nome'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{u.email}</div>
                      {isSelf && <span className="badge badge-info" style={{ marginTop: 2, fontSize: '0.7rem' }}>Você</span>}
                    </td>

                    <td style={{ minWidth: 160 }}>
                      <select
                        className="input"
                        style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                        value={role}
                        disabled={isSelf}
                        onChange={e => {
                          const val = e.target.value as UserRole;
                          onUpdateUser(u.uid, {
                            role: val,
                            isBishopric: val === 'bispado',
                            permissoes: u.permissoes || getDefaultPermissions(val),
                          });
                        }}
                      >
                        <option value="bispado">Bispado (Total/Confidencial)</option>
                        <option value="lider_org">Líder de Organização</option>
                        <option value="conselho">Conselho da Ala (Geral)</option>
                      </select>
                    </td>

                    <td style={{ minWidth: 200 }}>
                      {role === 'lider_org' ? (
                        <select
                          className="input"
                          style={{ padding: '4px 8px', fontSize: '0.85rem', marginBottom: 4 }}
                          value={u.organizacao || 'Sociedade de Socorro'}
                          onChange={e => {
                            onUpdateUser(u.uid, { organizacao: e.target.value });
                          }}
                        >
                          {ORGANIZACOES_ALA.map(org => (
                            <option key={org} value={org}>{org}</option>
                          ))}
                        </select>
                      ) : null}
                      <input
                        type="text"
                        className="input"
                        style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                        value={u.cargo || ''}
                        placeholder="Ex: Pres. Sociedade de Socorro"
                        onChange={e => {
                          onUpdateUser(u.uid, { cargo: e.target.value });
                        }}
                      />
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={u.canWrite !== false}
                        onChange={e => {
                          onUpdateUser(u.uid, { canWrite: e.target.checked });
                        }}
                        style={{ cursor: 'pointer', width: 16, height: 16 }}
                      />
                    </td>

                    <td>
                      <select
                        className="input"
                        style={{ padding: '4px 8px', fontSize: '0.85rem', width: 105 }}
                        value={u.ativo === false ? 'inativo' : 'ativo'}
                        disabled={isSelf}
                        onChange={e => {
                          onUpdateUser(u.uid, { ativo: e.target.value === 'ativo' });
                        }}
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary sm"
                        style={{ fontSize: '0.8rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => onOpenPermissionsModal(u)}
                      >
                        <Icon name="checks" size={14} />
                        Configurar Módulos
                      </button>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-primary sm"
                          onClick={() => onSaveUser(u)}
                          disabled={savingUid === u.uid}
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        >
                          {savingUid === u.uid ? 'Salvando...' : 'Salvar'}
                        </button>
                        {!isSelf && (
                          <button
                            className="btn-icon"
                            onClick={() => onDeleteUser(u.uid, u.displayName || u.email || 'usuário')}
                            style={{ color: 'var(--color-error)' }}
                            title="Excluir usuário"
                          >
                            <IconTrash size={16} />
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
  );
};
