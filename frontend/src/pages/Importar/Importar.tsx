import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth, getDefaultPermissions } from '../../context/AuthContext';
import { UserProfile } from '../../types';
import { ImportarHeader } from './ImportarHeader';
import { ImportarUsersTable } from './ImportarUsersTable';
import { ImportarPermissionsModal } from './ImportarPermissionsModal';
import { ImportarGuidesSection } from './ImportarGuidesSection';

export const Importar: React.FC = () => {
  const { isBishopric, user: currentUser } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  // Users & Permissions management
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [salvandoUid, setSalvandoUid] = useState<string | null>(null);
  const [msgSucessoPerm, setMsgSucessoPerm] = useState<string | null>(null);

  // Modal de Permissões Finas
  const [modalUser, setModalUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isBishopric) {
      carregarUsuarios();
    }
  }, [isBishopric]);

  const carregarUsuarios = async () => {
    try {
      setLoadingUsuarios(true);
      const res = await api.get<UserProfile[]>('/api/auth/users');
      setUsuarios(res || []);
    } catch (err) {
      console.error('Erro ao carregar lista de usuários:', err);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const handleUpdateUser = (uid: string, updates: Partial<UserProfile>) => {
    setUsuarios(prev =>
      prev.map(item => (item.uid === uid ? { ...item, ...updates } : item))
    );
  };

  const handleSalvarPermissao = async (u: UserProfile) => {
    try {
      setSalvandoUid(u.uid);
      await api.put(`/api/auth/users/${u.uid}`, {
        role: u.role,
        cargo: u.cargo,
        organizacao: u.organizacao,
        permissoes: u.permissoes,
        canWrite: u.canWrite,
        ativo: u.ativo,
      });
      setMsgSucessoPerm(`Permissões de ${u.displayName || u.email} atualizadas com sucesso!`);
      setTimeout(() => setMsgSucessoPerm(null), 3500);
      carregarUsuarios();
      if (modalUser?.uid === u.uid) {
        setModalUser(null);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao atualizar usuário: ${err.message || 'Falha na comunicação'}`);
    } finally {
      setSalvandoUid(null);
    }
  };

  const handleExcluirUsuario = async (uid: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${nome}"?`)) return;
    try {
      await api.delete(`/api/auth/users/${uid}`);
      setUsuarios(prev => prev.filter(u => u.uid !== uid));
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao excluir: ${err.message || 'Falha na comunicação'}`);
    }
  };

  const handleSeed = async () => {
    if (!confirm('Deseja inicializar a estrutura padrão da Ala (organizações, cargos e orçamentos de exemplo)?')) return;
    try {
      setSeeding(true);
      const res = await api.post<{ success: boolean; message: string }>('/api/seed/init', {});
      setSeedResult(res.message || 'Estrutura inicial criada com sucesso!');
    } catch (err: any) {
      console.error(err);
      setSeedResult(`Erro ao inicializar: ${err.message || 'Falha na conexão'}`);
    } finally {
      setSeeding(false);
    }
  };

  const abrirModalPermissoes = (u: UserProfile) => {
    const userRole = u.role || 'conselho';
    const permissoesAtuais =
      u.permissoes && Object.keys(u.permissoes).length > 0
        ? { ...u.permissoes }
        : getDefaultPermissions(userRole);

    setModalUser({
      ...u,
      role: userRole,
      permissoes: permissoesAtuais,
    });
  };

  return (
    <div>
      <ImportarHeader />

      {isBishopric && (
        <ImportarUsersTable
          usuarios={usuarios}
          loadingUsuarios={loadingUsuarios}
          currentUserUid={currentUser?.uid}
          savingUid={salvandoUid}
          msgSucessoPerm={msgSucessoPerm}
          onRefresh={carregarUsuarios}
          onUpdateUser={handleUpdateUser}
          onSaveUser={handleSalvarPermissao}
          onDeleteUser={handleExcluirUsuario}
          onOpenPermissionsModal={abrirModalPermissoes}
        />
      )}

      <ImportarPermissionsModal
        modalUser={modalUser}
        onClose={() => setModalUser(null)}
        onSave={updated => {
          setUsuarios(prev =>
            prev.map(item => (item.uid === updated.uid ? updated : item))
          );
          handleSalvarPermissao(updated);
        }}
        savingUid={salvandoUid}
      />

      <ImportarGuidesSection
        isBishopric={isBishopric}
        seeding={seeding}
        seedResult={seedResult}
        onSeed={handleSeed}
      />
    </div>
  );
};
