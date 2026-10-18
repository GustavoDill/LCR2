import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth, getDefaultPermissions } from '../context/AuthContext';
import { UserProfile, UserRole, UserPermissions } from '../types';
import { IconCheck, IconTrash, Icon } from '../components/Icons';

const ORGANIZACOES_ALA = [
  'Sociedade de Socorro',
  'Quórum de Élderes',
  'Moças',
  'Rapazes (Sacerdócio Aarônico)',
  'Primária',
  'Escola Dominical',
  'Música da Ala',
  'Templo e História da Família',
  'Trabalho Missionário',
  'Outro / Geral',
];

interface ModuloDesc {
  id: keyof UserPermissions;
  label: string;
  desc: string;
  icon: string;
  cor: string;
}

const MODULOS_SISTEMA: ModuloDesc[] = [
  { id: 'inicio', label: 'Visão Geral', desc: 'Resumo geral, métricas da semana e atalhos rápidos', icon: 'grid', cor: '#60a5fa' },
  { id: 'reuniao', label: 'Reunião de Bispado/Conselho', desc: 'Pauta interativa e atas em tempo real', icon: 'board', cor: '#f472b6' },
  { id: 'designacoes', label: 'Designações & Tarefas', desc: 'Acompanhamento de tarefas, prazos e responsáveis', icon: 'checks', cor: '#22d3ee' },
  { id: 'chamados', label: 'Chamados & Desobrigações', desc: 'Propostas de chamados, estado das bênçãos e lista', icon: 'idcard', cor: '#38bdf8' },
  { id: 'pessoas', label: 'Famílias & Pessoas', desc: 'Anotações confidenciais, visitas e necessidades', icon: 'heart', cor: '#fb923c' },
  { id: 'membros', label: 'Diretório de Membros', desc: 'Lista de membros da Ala, dados e ordenanças', icon: 'users', cor: '#f87171' },
  { id: 'seminario', label: 'Seminário & Instituto', desc: 'Frequência e leitura dos jovens e JA', icon: 'cap', cor: '#a78bfa' },
  { id: 'financeiro', label: 'Financeiro & Orçamento', desc: 'Orçamentos das organizações e saldo anual', icon: 'wallet', cor: '#a3e635' },
  { id: 'agenda', label: 'Agenda & Eventos', desc: 'Calendário geral de eventos e reuniões da Ala', icon: 'cal', cor: '#facc15' },
  { id: 'atividades', label: 'Planejamento de Atividades', desc: 'Propostas, orçamentos e formulários de atividades', icon: 'flag', cor: '#fb7185' },
  { id: 'natal', label: 'Festa de Natal', desc: 'Planejamento e comitê do evento anual de Natal', icon: 'gift', cor: '#f87171' },
  { id: 'indicadores', label: 'Indicadores & Frequência', desc: 'Gráficos de sacramentais e frequência trimestral', icon: 'target', cor: '#4ade80' },
  { id: 'atas', label: 'Histórico de Atas', desc: 'Consulta e busca de atas de reuniões anteriores', icon: 'file', cor: '#2dd4bf' },
];

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
    const permissoesAtuais = u.permissoes && Object.keys(u.permissoes).length > 0
      ? { ...u.permissoes }
      : getDefaultPermissions(userRole);

    setModalUser({
      ...u,
      role: userRole,
      permissoes: permissoesAtuais,
    });
  };

  const aplicarPreset = (role: UserRole) => {
    if (!modalUser) return;
    setModalUser({
      ...modalUser,
      role,
      isBishopric: role === 'bispado',
      permissoes: getDefaultPermissions(role),
    });
  };

  const alternarPermissaoModulo = (moduloId: keyof UserPermissions) => {
    if (!modalUser) return;
    const current = Boolean(modalUser.permissoes?.[moduloId]);
    setModalUser({
      ...modalUser,
      permissoes: {
        ...modalUser.permissoes,
        [moduloId]: !current,
      },
    });
  };

  const alternarTodas = (ativar: boolean) => {
    if (!modalUser) return;
    const nova: UserPermissions = {};
    MODULOS_SISTEMA.forEach(m => {
      nova[m.id] = ativar;
    });
    setModalUser({
      ...modalUser,
      permissoes: nova,
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', margin: 0 }}>Central de Dados & Permissões</h1>
        <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)' }}>
          Gestão de líderes da Ala, permissões granulares por organização e utilitários de sincronização
        </p>
      </div>

      {/* Permissions Management Section for Bishopric */}
      {isBishopric && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Gestão de Líderes e Permissões de Acesso</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Defina o papel (<strong>Bispado</strong>, <strong>Líder de Org</strong> ou <strong>Conselho</strong>) e ajuste individualmente cada módulo que o líder pode ver e operar.
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
                    const isSelf = currentUser?.uid === u.uid;
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
                              setUsuarios(prev =>
                                prev.map(item =>
                                  item.uid === u.uid
                                    ? {
                                        ...item,
                                        role: val,
                                        isBishopric: val === 'bispado',
                                        permissoes: item.permissoes || getDefaultPermissions(val),
                                      }
                                    : item
                                )
                              );
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
                                const orgVal = e.target.value;
                                setUsuarios(prev =>
                                  prev.map(item => (item.uid === u.uid ? { ...item, organizacao: orgVal } : item))
                                );
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
                            style={{ padding: '4px 8px', fontSize: '0.85rem', width: 105 }}
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
                            <option value="inativo">Inativo</option>
                          </select>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary sm"
                            style={{ fontSize: '0.8rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={() => abrirModalPermissoes(u)}
                          >
                            <Icon name="checks" size={14} />
                            Configurar Módulos
                          </button>
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-primary sm"
                              onClick={() => handleSalvarPermissao(u)}
                              disabled={salvandoUid === u.uid}
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
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

      {/* Modal de Configuração Fina de Permissões */}
      {modalUser && (
        <div className="modal" onClick={() => setModalUser(null)}>
          <div className="sheet wide" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: 16, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>
                  Permissões Granulares: {modalUser.displayName || modalUser.email}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Personalize o que este líder pode acessar na plataforma Ala Bosque.
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setModalUser(null)}
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
                  value={modalUser.role}
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

              {modalUser.role === 'lider_org' && (
                <div>
                  <label className="label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Organização do Líder</label>
                  <select
                    className="input"
                    value={modalUser.organizacao || 'Sociedade de Socorro'}
                    onChange={e => setModalUser({ ...modalUser, organizacao: e.target.value })}
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
                  value={modalUser.cargo || ''}
                  placeholder="Ex: 1ª Conselheira da Soc. Socorro"
                  onChange={e => setModalUser({ ...modalUser, cargo: e.target.value })}
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
                const isPermitido = modalUser.role === 'bispado' ? true : Boolean(modalUser.permissoes?.[m.id]);
                const isBishopricLock = modalUser.role === 'bispado';

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
                onClick={() => setModalUser(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setUsuarios(prev =>
                    prev.map(item => (item.uid === modalUser.uid ? modalUser : item))
                  );
                  handleSalvarPermissao(modalUser);
                }}
                disabled={salvandoUid === modalUser.uid}
              >
                {salvandoUid === modalUser.uid ? 'Salvando Permissões...' : 'Salvar Permissões'}
              </button>
            </div>
          </div>
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
