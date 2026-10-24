import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout, TABS } from './components/Layout';

// Pages
import { Inicio } from './pages/Inicio';
import { Designacoes } from './pages/Designacoes';
import { Mural } from './pages/Mural';
import { Reuniao } from './pages/Reuniao';
import { Atas } from './pages/Atas';
import { ChamadosDesobrigacoes } from './pages/ChamadosDesobrigacoes';
import { Pessoas } from './pages/Pessoas';
import { Chamados } from './pages/Chamados';
import { Membros } from './pages/Membros';
import { Seminario } from './pages/Seminario';
import { Financeiro } from './pages/Financeiro';
import { Agenda } from './pages/Agenda';
import { Atividades } from './pages/Atividades';
import { Natal } from './pages/Natal';
import { Indicadores } from './pages/Indicadores';
import { Importar } from './pages/Importar';
import { Gerenciamento } from './pages/Gerenciamento';
import { Login, AwaitingApprovalView } from './pages/Login';

// Protected Route Guard for logged in users
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoggedIn, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando sessão...</div>
      </div>
    );
  }
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (user?.statusAcesso === 'pendente' || user?.statusAcesso === 'recusado') {
    return <AwaitingApprovalView />;
  }
  return <>{children}</>;
};

// Protected Route Guard for module permissions
const PermissionRoute: React.FC<{ modulo: string; children: React.ReactNode }> = ({ modulo, children }) => {
  const { user, hasPermission, isLoggedIn, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando sessão...</div>
      </div>
    );
  }
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (user?.statusAcesso === 'pendente' || user?.statusAcesso === 'recusado') {
    return <AwaitingApprovalView />;
  }
  if (!hasPermission(modulo)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Protected Route Guard for Bishopric-only administration
const BishopricRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isBishopric, isLoggedIn, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando sessão...</div>
      </div>
    );
  }
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (user?.statusAcesso === 'pendente' || user?.statusAcesso === 'recusado') {
    return <AwaitingApprovalView />;
  }
  if (!isBishopric) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Route component ensuring that if user lacks permission for 'inicio', they are redirected to their first accessible tab
const InicioRoute: React.FC = () => {
  const { hasPermission, isBishopric } = useAuth();

  if (!isBishopric && !hasPermission('inicio')) {
    const allowed = TABS.find(t => t.id !== 'inicio' && hasPermission(t.id));
    if (allowed) {
      return <Navigate to={allowed.path} replace />;
    }
    return (
      <div style={{ maxWidth: 540, margin: '60px auto', padding: '36px 28px', background: 'var(--color-surface, #fff)', borderRadius: 16, border: '1px solid var(--color-border, #e2e8f0)', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔒</div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>Nenhum Módulo Liberado</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: '0 0 10px 0', fontSize: '0.88rem', lineHeight: 1.55 }}>
          Sua conta está ativa, porém ainda não possui permissão de acesso a nenhum módulo do sistema. Contate o Bispado ou um administrador para configurar suas permissões na <strong>Central de Gerenciamento</strong>.
        </p>
      </div>
    );
  }

  return <Inicio />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Main app layout wrapper */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <InicioRoute />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/designacoes"
        element={
          <PermissionRoute modulo="designacoes">
            <Layout>
              <Designacoes />
            </Layout>
          </PermissionRoute>
        }
      />
      <Route
        path="/mural"
        element={
          <PermissionRoute modulo="mural">
            <Layout>
              <Mural />
            </Layout>
          </PermissionRoute>
        }
      />
      <Route
        path="/reuniao"
        element={
          <PermissionRoute modulo="reuniao">
            <Layout>
              <Reuniao />
            </Layout>
          </PermissionRoute>
        }
      />
      <Route
        path="/atas"
        element={
          <PermissionRoute modulo="atas">
            <Layout>
              <Atas />
            </Layout>
          </PermissionRoute>
        }
      />
      <Route
        path="/chamados-desobrigacoes"
        element={
          <PermissionRoute modulo="chamados">
            <Layout>
              <ChamadosDesobrigacoes />
            </Layout>
          </PermissionRoute>
        }
      />
      <Route
        path="/chamados"
        element={
          <PermissionRoute modulo="chamados">
            <Layout>
              <Chamados />
            </Layout>
          </PermissionRoute>
        }
      />
      <Route
        path="/seminario"
        element={
          <PermissionRoute modulo="seminario">
            <Layout>
              <Seminario />
            </Layout>
          </PermissionRoute>
        }
      />
      <Route
        path="/agenda"
        element={
          <PermissionRoute modulo="agenda">
            <Layout>
              <Agenda />
            </Layout>
          </PermissionRoute>
        }
      />
      <Route
        path="/atividades"
        element={
          <PermissionRoute modulo="atividades">
            <Layout>
              <Atividades />
            </Layout>
          </PermissionRoute>
        }
      />
      <Route
        path="/natal"
        element={
          <PermissionRoute modulo="natal">
            <Layout>
              <Natal />
            </Layout>
          </PermissionRoute>
        }
      />
      <Route
        path="/indicadores"
        element={
          <PermissionRoute modulo="indicadores">
            <Layout>
              <Indicadores />
            </Layout>
          </PermissionRoute>
        }
      />
      <Route
        path="/pessoas"
        element={
          <PermissionRoute modulo="pessoas">
            <Layout>
              <Pessoas />
            </Layout>
          </PermissionRoute>
        }
      />
      <Route
        path="/membros"
        element={
          <PermissionRoute modulo="membros">
            <Layout>
              <Membros />
            </Layout>
          </PermissionRoute>
        }
      />
      <Route
        path="/financeiro"
        element={
          <PermissionRoute modulo="financeiro">
            <Layout>
              <Financeiro />
            </Layout>
          </PermissionRoute>
        }
      />

      {/* Bishopric Confidential Administration / Central de Gerenciamento */}
      <Route
        path="/gerenciamento"
        element={
          <PermissionRoute modulo="gerenciamento">
            <Layout>
              <Gerenciamento />
            </Layout>
          </PermissionRoute>
        }
      />
      <Route path="/importar" element={<Navigate to="/gerenciamento" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
