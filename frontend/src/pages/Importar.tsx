import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import { IconCheck, IconTrash } from '../components/Icons';

export const Importar: React.FC = () => {
  const { isBishopric, user: currentUser } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  // Users & Permissions management
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [salvandoUid, setSalvandoUid] = useState<string | null>(null);
  const [msgSucessoPerm, setMsgSucessoPerm] = useState<string | null>(null);

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

  const handleSalvarPermissao = async (u: UserProfile) => {
    try {
      setSalvandoUid(u.uid);
      await api.put(`/api/auth/users/${u.uid}`, {
        role: u.role,
        cargo: u.cargo,
        organizacao: u.organizacao,
        canWrite: u.canWrite,
        ativo: u.ativo,
      });
      setMsgSucessoPerm(`Permissões de ${u.displayName || u.email} atualizadas!`);
      setTimeout(() => setMsgSucessoPerm(null), 3500);
      carregarUsuarios();
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

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', margin: 0 }}>Central de Dados & Permissões</h1>
        <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)' }}>
          Gestão de acessos dos líderes da Ala, orientações de exportação do LCR e utilitários
        </p>
      </div>

      {/* Permissions Management Section for Bishopric */}
      {isBishopric && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Gestão de Líderes e Permissões de Acesso</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Controle quem tem acesso confidencial de <strong>Bispado</strong> versus acesso de <strong>Conselho da Ala</strong>.
              </p>
            </div>
            <button className="btn btn-secondary sm" onClick={carregarUsuarios} disabled={loadingUsuarios}>
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
              Nenhum outro usuário cadastrado no Firebase. Quando outros líderes criarem conta, eles aparecerão aqui.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome / E-mail</th>
                    <th>Nível de Acesso (Papel)</th>
                    <th>Chamado / Cargo</th>
                    <th>Pode Editar?</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => {
                    const isSelf = currentUser?.uid === u.uid;
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
                            value={u.role || 'conselho'}
                            disabled={isSelf}
                            onChange={e => {
                              const val = e.target.value as 'bispado' | 'conselho';
                              setUsuarios(prev =>
                                prev.map(item =>
                                  item.uid === u.uid
                                    ? { ...item, role: val, isBishopric: val === 'bispado' }
                                    : item
                                )
                              );
                            }}
                          >
                            <option value="conselho">Conselho da Ala (Restrito)</option>
                            <option value="bispado">Bispado (Confidencial)</option>
                          </select>
                        </td>

                        <td style={{ minWidth: 180 }}>
                          <input
                            type="text"
                            className="input"
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                            value={u.cargo || ''}
                            placeholder="Ex: Pres. Sociedade de Socorro"
                            onChange={e => {
                              const val = e.target.value;
                              setUsuarios(prev =>
                                prev.map(item => (item.uid === u.uid ? { ...item, cargo: val } : item))
                              );
                            }}
                          />
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={u.canWrite !== false}
                            onChange={e => {
                              const checked = e.target.checked;
                              setUsuarios(prev =>
                                prev.map(item => (item.uid === u.uid ? { ...item, canWrite: checked } : item))
                              );
                            }}
                            style={{ cursor: 'pointer', width: 16, height: 16 }}
                          />
                        </td>

                        <td>
                          <select
                            className="input"
                            style={{ padding: '4px 8px', fontSize: '0.85rem', width: 110 }}
                            value={u.ativo === false ? 'inativo' : 'ativo'}
                            disabled={isSelf}
                            onChange={e => {
                              const isAtivo = e.target.value === 'ativo';
                              setUsuarios(prev =>
                                prev.map(item => (item.uid === u.uid ? { ...item, ativo: isAtivo } : item))
                              );
                            }}
                          >
                            <option value="ativo">Ativo</option>
                            <option value="inativo">Desativado</option>
                          </select>
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-primary sm"
                              onClick={() => handleSalvarPermissao(u)}
                              disabled={salvandoUid === u.uid}
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            >
                              {salvandoUid === u.uid ? 'Salvando...' : 'Salvar'}
                            </button>
                            {!isSelf && (
                              <button
                                className="btn-icon"
                                onClick={() => handleExcluirUsuario(u.uid, u.displayName || u.email || 'usuário')}
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
      )}

      {/* Guide Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* LCR Member export guide */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>1. Lista de Membros da Ala (LCR)</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Como extrair o relatório completo de membros da ala para importar na aba <strong>Membros</strong>:
          </p>

          <ol style={{ fontSize: '0.9rem', paddingLeft: 20, lineHeight: 1.6 }}>
            <li>Acesse o sistema oficial <code>ChurchofJesusChrist.org</code> &gt; <strong>LCR</strong>.</li>
            <li>No menu superior, vá em <strong>Relatórios &gt; Lista de Membros</strong>.</li>
            <li>Selecione exibir colunas completas: Nome, Registro de Membro, Data de Nascimento, Telefone, Endereço.</li>
            <li>Clique no botão <strong>Exportar &gt; CSV ou Excel</strong>.</li>
            <li>Abra a aba <a href="/membros" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Membros</a> neste sistema e use o botão <em>&ldquo;Importar Lista LCR&rdquo;</em>.</li>
          </ol>
        </div>

        {/* LCR Seminary export guide */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>2. Relatório SIR (Seminário e Instituto)</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Como acompanhar o progresso dos jovens e jovens adultos:
          </p>

          <ol style={{ fontSize: '0.9rem', paddingLeft: 20, lineHeight: 1.6 }}>
            <li>No LCR ou no portal <code>si.churchofjesuschrist.org</code>.</li>
            <li>Gere o relatório de <strong>Matrícula e Frequência do Seminário da Ala Bosque</strong>.</li>
            <li>Identifique jovens com frequência abaixo de 75% ou com pendência de leitura das escrituras.</li>
            <li>Lançamentos ou edições podem ser feitos na aba <a href="/seminario" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Seminário / SIR</a>.</li>
          </ol>
        </div>

        {/* Seed Card */}
        {isBishopric && (
          <div className="card" style={{ border: '1px solid var(--color-primary-light)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--color-primary)' }}>3. Inicializar / Restaurar Estrutura Padrão</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Se o banco de dados estiver vazio, você pode pré-carregar as organizações da Ala (Bispado, Quórum de Élderes, Sociedade de Socorro, Moças, Primária, Rapazes, Escola Dominical) e os orçamentos trimestrais padrão.
            </p>

            {seedResult && (
              <div
                style={{
                  padding: 12,
                  marginBottom: 16,
                  borderRadius: 'var(--radius)',
                  background: 'var(--color-surface-hover)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <IconCheck size={16} color="var(--color-success)" />
                {seedResult}
              </div>
            )}

            <button
              onClick={handleSeed}
              className="btn btn-primary"
              disabled={seeding}
              style={{ width: '100%' }}
            >
              {seeding ? 'Inicializando...' : 'Executar Carga Inicial de Dados'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
