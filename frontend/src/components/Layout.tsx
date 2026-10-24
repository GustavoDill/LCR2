import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon } from './Icons';
import { api } from '../api/client';

export interface TabInfo {
  id: string;
  path: string;
  l: string;
  i: string;
  c: string;
  b?: boolean; // Bishopric only
}

export const TABS: TabInfo[] = [
  { id: 'inicio', path: '/', l: 'Visão geral', i: 'grid', c: '#60a5fa' },
  { id: 'reuniao', path: '/reuniao', l: 'Reunião', i: 'board', c: '#f472b6' },
  { id: 'designacoes', path: '/designacoes', l: 'Designações', i: 'checks', c: '#22d3ee' },
  { id: 'mural', path: '/mural', l: 'Mural Semanal', i: 'image', c: '#f59e0b' },
  { id: 'chamdes', path: '/chamados-desobrigacoes', l: 'Chamados e desobrigações', i: 'userplus', c: '#c084fc', b: true },
  { id: 'pessoas', path: '/pessoas', l: 'Pessoas', i: 'heart', c: '#fb923c', b: true },
  { id: 'chamados', path: '/chamados', l: 'Lista de Chamados', i: 'idcard', c: '#38bdf8', b: true },
  { id: 'membros', path: '/membros', l: 'Membros', i: 'users', c: '#f87171', b: true },
  { id: 'seminario', path: '/seminario', l: 'Seminário e Instituto', i: 'cap', c: '#a78bfa', b: true },
  { id: 'financeiro', path: '/financeiro', l: 'Financeiro', i: 'wallet', c: '#a3e635', b: true },
  { id: 'agenda', path: '/agenda', l: 'Agenda', i: 'cal', c: '#facc15' },
  { id: 'atividades', path: '/atividades', l: 'Atividades', i: 'flag', c: '#fb7185' },
  { id: 'natal', path: '/natal', l: 'Festa de Natal', i: 'gift', c: '#f87171' },
  { id: 'indicadores', path: '/indicadores', l: 'Indicadores', i: 'target', c: '#4ade80' },
  { id: 'atas', path: '/atas', l: 'Atas', i: 'file', c: '#2dd4bf' },
  { id: 'gerenciamento', path: '/gerenciamento', l: 'Gerenciamento', i: 'shield', c: '#94a3b8', b: true },
];

export const NAV_GROUPS = [
  { g: 'Reuniões', items: ['inicio', 'reuniao', 'designacoes', 'mural', 'chamdes', 'atas', 'agenda', 'atividades', 'natal'] },
  { g: 'Acompanhamento', items: ['pessoas', 'chamados', 'membros', 'seminario', 'indicadores'] },
  { g: 'Administração', items: ['financeiro', 'gerenciamento'] },
];

export const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isBishopric, role, user, toggleDevRole, signOut, hasPermission } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [counts, setCounts] = useState({ late: 0, live: 0, atvPend: 0 });
  const [syncStatus, setSyncStatus] = useState('Conectado ao servidor');
  const location = useLocation();

  const MESES = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  const WD = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const todayDate = new Date();
  const todayFormatted = `${WD[todayDate.getDay()]}, ${todayDate.getDate()} de ${MESES[todayDate.getMonth()]}`;

  useEffect(() => {
    async function loadStats() {
      try {
        const resumo = await api.get('/dashboard/resumo');
        setCounts({
          late: resumo.lateTasksCount || 0,
          live: resumo.liveMeetings?.length || 0,
          atvPend: resumo.pendingAtividadesCount || 0,
        });
        setSyncStatus('Dados sincronizados');
      } catch {
        setSyncStatus('Servidor desconectado');
      }
    }
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const curTab = TABS.find(t => (t.path === '/' ? location.pathname === '/' : location.pathname.startsWith(t.path))) || TABS[0];

  const totalAllowedTabs = NAV_GROUPS.reduce(
    (acc, g) => acc + g.items.filter(id => hasPermission(id)).length,
    0
  );
  const isZeroUser = !isBishopric && totalAllowedTabs === 0;

  return (
    <div className={`shell ${collapsed ? 'sb-collapsed' : ''} ${mobileOpen ? 'sb-open' : ''}`}>
      <aside className="sb" id="sb" aria-label="Menu principal">
        <div className="sb-brand">
          <div className="sb-logo" aria-hidden="true">
            <svg viewBox="0 0 32 32">
              <path d="M11 4l6 9h-3.5l5 7.5H13V27h-4v-6.5H3l5-7.5H4.5z" fill="#ffffff" />
              <path d="M22.5 9l4.5 6.5h-2.6l3.6 5.5h-4V27h-3v-6h-1.5l2.5-3.8-2-2.7z" fill="#bcd3f7" />
            </svg>
          </div>
          <div className="sb-bt">
            <small>
              {isBishopric
                ? 'Bispado'
                : user?.statusAcesso === 'pendente'
                ? 'Aguardando Aprovação'
                : isZeroUser
                ? 'Sem Acesso'
                : role === 'lider_org'
                ? `Líder • ${user?.organizacao || 'Organização'}`
                : 'Conselho da Ala'}
            </small>
            <h1>Ala Bosque</h1>
          </div>
        </div>

        <nav id="tabs">
          {totalAllowedTabs === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9bb1d4', fontSize: '0.8rem', lineHeight: 1.45 }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>🔒</div>
              <strong style={{ display: 'block', color: '#fff', marginBottom: 4 }}>Nenhum módulo liberado</strong>
              Aguardando liberação de permissões pelo Bispado.
            </div>
          ) : (
            NAV_GROUPS.map(group => {
              // Strictly filter by permission for each tab: if user lacks permission, it is NEVER shown!
              const available = group.items
                .map(id => TABS.find(t => t.id === id)!)
                .filter(t => (t ? hasPermission(t.id) : false));

              if (!available.length) return null;

              return (
                <React.Fragment key={group.g}>
                  <div className="sb-sec">{group.g}</div>
                  {available.map(tab => (
                    <NavLink
                      key={tab.id}
                      to={tab.path}
                      className={({ isActive }) => `sb-item ${isActive ? 'on' : ''}`}
                      style={{ '--ic': tab.c } as React.CSSProperties}
                      title={tab.l}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon name={tab.i} />
                      <span className="sb-l">{tab.l}</span>
                      {tab.id === 'designacoes' && counts.late > 0 && (
                        <span className="badge crit num">{counts.late}</span>
                      )}
                      {tab.id === 'reuniao' && counts.live > 0 && (
                        <span className="live" title="Reunião em andamento"></span>
                      )}
                      {tab.id === 'atividades' && counts.atvPend > 0 && (
                        <span className="badge crit num" title="Aguardando aprovação">
                          {counts.atvPend}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </React.Fragment>
              );
            })
          )}
        </nav>

        <div className="sb-foot">
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>
            {user?.displayName || user?.email || 'Ala Bosque'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9bb1d4', marginTop: 2 }}>
            {user?.cargo || (isBishopric ? 'Membro do Bispado' : role === 'lider_org' ? 'Líder de Organização' : isZeroUser ? 'Sem Permissões' : 'Conselho da Ala')}
          </div>
          <button
            type="button"
            className="btn ghost sm"
            style={{ marginTop: 8, padding: '4px 6px', fontSize: 11, color: '#9bb1d4' }}
            onClick={toggleDevRole}
            title="Alternar entre visualização de Bispado, Líder de Organização, Conselho e Sem Acesso"
          >
            Simular: {isBishopric ? 'Bispado' : role === 'lider_org' ? 'Líder Org' : isZeroUser ? 'Sem Acesso (Zero)' : 'Conselho'} ⇄
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} />}

      <div className="main" id="content">
        <header className="top" aria-label="Barra de ferramentas superior">
          <button
            type="button"
            className="icon-btn"
            id="sb-toggle"
            aria-label="Menu"
            onClick={() => {
              if (window.innerWidth <= 900) setMobileOpen(!mobileOpen);
              else setCollapsed(!collapsed);
            }}
          >
            <Icon name="bars" />
          </button>
          <div className="top-t">
            <span className="eyebrow">Bispado Ala Bosque</span>
            <b id="top-title">{curTab.l}</b>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="today">
              <div>
                <b>{todayFormatted}</b>
              </div>
              <div className="sync">{syncStatus}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: '1px solid var(--color-border)', paddingLeft: 14 }}>
              <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  {user?.displayName || user?.email || 'Usuário'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 2 }}>
                  <span
                    className={`badge ${isBishopric ? 'badge-primary' : role === 'lider_org' ? 'badge-warning' : isZeroUser ? 'badge-danger' : 'badge-info'}`}
                    style={{ padding: '1px 5px', fontSize: '0.68rem' }}
                  >
                    {isBishopric ? 'Bispado' : isZeroUser ? 'Sem Acesso' : role === 'lider_org' ? (user?.organizacao || 'Líder Org') : 'Conselho'}
                  </span>
                  {user?.cargo && <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.cargo}</span>}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary sm"
                onClick={() => signOut()}
                title="Encerrar sessão"
                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <div className="app">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
};
