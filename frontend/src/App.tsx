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

// Protected Route Guard for Bishopric-only features
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
          <ProtectedRoute>
            <Layout>
              <Designacoes />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reuniao"
        element={
          <ProtectedRoute>
            <Layout>
              <Reuniao />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/atas"
        element={
          <ProtectedRoute>
            <Layout>
              <Atas />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chamados-desobrigacoes"
        element={
          <ProtectedRoute>
            <Layout>
              <ChamadosDesobrigacoes />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chamados"
        element={
          <ProtectedRoute>
            <Layout>
              <Chamados />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/seminario"
        element={
          <ProtectedRoute>
            <Layout>
              <Seminario />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/agenda"
        element={
          <ProtectedRoute>
            <Layout>
              <Agenda />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/atividades"
        element={
          <ProtectedRoute>
            <Layout>
              <Atividades />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/natal"
        element={
          <ProtectedRoute>
            <Layout>
              <Natal />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/indicadores"
        element={
          <ProtectedRoute>
            <Layout>
              <Indicadores />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/importar"
        element={
          <ProtectedRoute>
            <Layout>
              <Importar />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Bishopric Confidential Routes */}
      <Route
        path="/pessoas"
        element={
          <BishopricRoute>
            <Layout>
              <Pessoas />
            </Layout>
          </BishopricRoute>
        }
      />
      <Route
        path="/membros"
        element={
          <BishopricRoute>
            <Layout>
              <Membros />
            </Layout>
          </BishopricRoute>
        }
      />
      <Route
        path="/financeiro"
        element={
          <BishopricRoute>
            <Layout>
              <Financeiro />
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
