import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';

// Pages
import { Inicio } from './pages/Inicio';
import { Designacoes } from './pages/Designacoes';
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
import { Login } from './pages/Login';

// Protected Route Guard for logged in users
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando sessão...</div>
      </div>
    );
  }
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Protected Route Guard for module permissions
const PermissionRoute: React.FC<{ modulo: string; children: React.ReactNode }> = ({ modulo, children }) => {
  const { hasPermission, isBishopric, isLoggedIn, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando sessão...</div>
      </div>
    );
  }
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isBishopric && !hasPermission(modulo)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Protected Route Guard for Bishopric-only administration
const BishopricRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isBishopric, isLoggedIn, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando sessão...</div>
      </div>
    );
  }
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isBishopric) return <Navigate to="/" replace />;
  return <>{children}</>;
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
              <Inicio />
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

      {/* Bishopric Confidential Administration */}
      <Route
        path="/importar"
        element={
          <BishopricRoute>
            <Layout>
              <Importar />
            </Layout>
          </BishopricRoute>
        }
      />

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
