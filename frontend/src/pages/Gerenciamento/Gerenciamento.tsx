import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types';
import { IconShield, IconDatabase, IconSliders } from '../../components/Icons';
import { GerenciamentoDadosTab } from './GerenciamentoDadosTab';
import { GerenciamentoUsuariosTab } from './GerenciamentoUsuariosTab';
import { GerenciamentoPermissoesTab } from './GerenciamentoPermissoesTab';

export type GerenciamentoSubTab = 'dados' | 'usuarios' | 'permissoes';

export const Gerenciamento: React.FC = () => {
  const { isBishopric, user: currentUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<GerenciamentoSubTab>('dados');
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<UserProfile | null>(null);

  useEffect(() => {
    carregarUsuarios();
  }, [isBishopric]);

  const carregarUsuarios = async () => {
    try {
      setLoadingUsuarios(true);
      const res = await api.get<UserProfile[]>('/api/auth/users');
      setUsuarios(res || []);
      if (!selectedUserForPermissions && res && res.length > 0) {
        setSelectedUserForPermissions(res[0]);
      }
    } catch (err) {
      console.error('Erro ao buscar lista de usuários:', err);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const handleSelectUserForPermissions = (u: UserProfile) => {
    setSelectedUserForPermissions(u);
    setActiveSubTab('permissoes');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.8rem' }}>🛡️</span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', margin: 0 }}>
              Central de Gerenciamento
            </h1>
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Governança de dados do LCR, gestão de usuários e controle de permissões granulares da Ala Bosque
          </p>
        </div>

        {/* Subtabs Bar */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--color-surface, #fff)',
            borderRadius: 'var(--radius, 10px)',
            border: '1px solid var(--color-border)',
            padding: 4,
            gap: 4,
          }}
        >
          <button
            type="button"
            className={`btn ${activeSubTab === 'dados' ? 'btn-primary' : 'btn-secondary'} sm`}
            onClick={() => setActiveSubTab('dados')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <IconDatabase size={15} /> Gerenciamento de Dados
          </button>

          <button
            type="button"
            className={`btn ${activeSubTab === 'usuarios' ? 'btn-primary' : 'btn-secondary'} sm`}
            onClick={() => setActiveSubTab('usuarios')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            👥 Usuários ({usuarios.length})
          </button>

          <button
            type="button"
            className={`btn ${activeSubTab === 'permissoes' ? 'btn-primary' : 'btn-secondary'} sm`}
            onClick={() => setActiveSubTab('permissoes')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <IconShield size={15} /> Permissões Granulares
          </button>
        </div>
      </div>

      {/* Active Tab View */}
      {activeSubTab === 'dados' && <GerenciamentoDadosTab />}

      {activeSubTab === 'usuarios' && (
        <GerenciamentoUsuariosTab
          usuarios={usuarios}
          loading={loadingUsuarios}
          currentUserUid={currentUser?.uid}
          onRefresh={carregarUsuarios}
          onSelectUserForPermissions={handleSelectUserForPermissions}
        />
      )}

      {activeSubTab === 'permissoes' && (
        <GerenciamentoPermissoesTab
          usuarios={usuarios}
          selectedUser={selectedUserForPermissions}
          onSelectUser={setSelectedUserForPermissions}
          onRefresh={carregarUsuarios}
        />
      )}
    </div>
  );
};
