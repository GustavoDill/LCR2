import React from 'react';
import { UserProfile, UserRole, UserPermissions } from '../../types';
import { getDefaultPermissions } from '../../context/AuthContext';
import { Icon } from '../../components/Icons';
import { ORGANIZACOES_ALA, MODULOS_SISTEMA } from './importarConstants';

interface ImportarPermissionsModalProps {
  modalUser: UserProfile | null;
  onClose: () => void;
  onSave: (updatedUser: UserProfile) => void;
  savingUid: string | null;
}

export const ImportarPermissionsModal: React.FC<ImportarPermissionsModalProps> = ({
  modalUser,
  onClose,
  onSave,
  savingUid,
}) => {
  if (!modalUser) return null;

  const [localUser, setLocalUser] = React.useState<UserProfile>({ ...modalUser });

  React.useEffect(() => {
    setLocalUser({ ...modalUser });
  }, [modalUser]);

  const aplicarPreset = (role: UserRole) => {
    setLocalUser(prev => ({
      ...prev,
      role,
      isBishopric: role === 'bispado',
      permissoes: getDefaultPermissions(role),
    }));
  };

  const alternarPermissaoModulo = (moduloId: keyof UserPermissions) => {
    const current = Boolean(localUser.permissoes?.[moduloId]);
    setLocalUser(prev => ({
      ...prev,
      permissoes: {
        ...prev.permissoes,
        [moduloId]: !current,
      },
    }));
  };

  const alternarTodas = (ativar: boolean) => {
    const nova: UserPermissions = {};
    MODULOS_SISTEMA.forEach(m => {
      nova[m.id] = ativar;
    });
    setLocalUser(prev => ({
      ...prev,
      permissoes: nova,
    }));
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet wide" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: 16, marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>
              Permissões Granulares: {localUser.displayName || localUser.email}
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              Personalize o que este líder pode acessar na plataforma Ala Bosque.
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{ fontSize: '1.2rem', padding: 4 }}
          >
            ✕
          </button>
        </div>

        {/* Configuração de Papel & Organização */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16, background: 'var(--color-bg-subtle, rgba(0,0,0,0.03))', padding: 12, borderRadius: 8 }}>
          <div>
            <label className="label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Papel Geral</label>
            <select
              className="input"
              value={localUser.role}
              onChange={e => {
                const r = e.target.value as UserRole;
                aplicarPreset(r);
              }}
            >
              <option value="bispado">Bispado (Acesso Confidencial Total)</option>
              <option value="lider_org">Líder de Organização</option>
              <option value="conselho">Conselho da Ala (Padrão)</option>
            </select>
          </div>

          {localUser.role === 'lider_org' && (
            <div>
              <label className="label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Organização do Líder</label>
              <select
                className="input"
                value={localUser.organizacao || 'Sociedade de Socorro'}
                onChange={e => setLocalUser(prev => ({ ...prev, organizacao: e.target.value }))}
              >
                {ORGANIZACOES_ALA.map(org => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Cargo / Chamado</label>
            <input
              type="text"
              className="input"
              value={localUser.cargo || ''}
              placeholder="Ex: 1ª Conselheira da Soc. Socorro"
              onChange={e => setLocalUser(prev => ({ ...prev, cargo: e.target.value }))}
            />
          </div>
        </div>

        {/* Presets Rápidos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>
            Módulos do Sistema:
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="btn btn-secondary sm"
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              onClick={() => aplicarPreset('bispado')}
            >
              Preset Bispado
            </button>
            <button
              type="button"
              className="btn btn-secondary sm"
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              onClick={() => aplicarPreset('lider_org')}
            >
              Preset Líder Org
            </button>
            <button
              type="button"
              className="btn btn-secondary sm"
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              onClick={() => aplicarPreset('conselho')}
            >
              Preset Conselho
            </button>
            <button
              type="button"
              className="btn ghost sm"
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              onClick={() => alternarTodas(true)}
            >
              Marcar Todos
            </button>
            <button
              type="button"
              className="btn ghost sm"
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              onClick={() => alternarTodas(false)}
            >
              Desmarcar Todos
            </button>
          </div>
        </div>

        {/* Grade de Módulos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10, maxHeight: 380, overflowY: 'auto', paddingRight: 4, marginBottom: 20 }}>
          {MODULOS_SISTEMA.map(m => {
            const isPermitido = localUser.role === 'bispado' ? true : Boolean(localUser.permissoes?.[m.id]);
            const isBishopricLock = localUser.role === 'bispado';

            return (
              <div
                key={m.id}
                onClick={() => !isBishopricLock && alternarPermissaoModulo(m.id)}
                style={{
                  border: `1px solid ${isPermitido ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  background: isPermitido ? 'var(--color-primary-light, rgba(96, 165, 250, 0.08))' : 'var(--color-surface)',
                  cursor: isBishopricLock ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={isPermitido}
                  disabled={isBishopricLock}
                  onChange={() => !isBishopricLock && alternarPermissaoModulo(m.id)}
                  style={{ width: 18, height: 18, cursor: isBishopricLock ? 'default' : 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.88rem' }}>
                    <span style={{ color: m.cor }}><Icon name={m.icon} size={16} /></span>
                    {m.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {m.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ações do Modal */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onSave(localUser)}
            disabled={savingUid === localUser.uid}
          >
            {savingUid === localUser.uid ? 'Salvando Permissões...' : 'Salvar Permissões'}
          </button>
        </div>
      </div>
    </div>
  );
};
