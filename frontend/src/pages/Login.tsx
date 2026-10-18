import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconCheck } from '../components/Icons';

const GoogleIcon: React.FC = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 10 }}>
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.43 7.37 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.98 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.57 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, sendPasswordReset, loginAsDevRole, isLoggedIn, user, role } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const getFriendlyErrorMessage = (err: any): string => {
    const code = err.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'E-mail ou senha incorretos. Por favor, verifique suas credenciais.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'Este e-mail já está cadastrado. Tente entrar ou redefinir sua senha.';
    }
    if (code === 'auth/weak-password') {
      return 'A senha deve ter no mínimo 6 caracteres.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Muitas tentativas malsucedidas. Aguarde alguns instantes antes de tentar novamente.';
    }
    if (code === 'auth/invalid-email') {
      return 'Endereço de e-mail inválido.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'O provedor Google precisa ser ativado no Firebase Console (Acesse: Authentication > Sign-in method > Google e clique em Ativar).';
    }
    return err.message || 'Ocorreu um erro ao processar. Tente novamente.';
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErro(null);
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error('Google login error:', err);
      setErro(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      setLoading(true);
      setErro(null);
      await signIn(email.trim(), password);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setErro(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (password !== confirmPassword) {
      setErro('As senhas digitadas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setErro('A senha deve conter pelo menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      setErro(null);
      await signUp(email.trim(), password, displayName.trim());
      navigate('/');
    } catch (err: any) {
      console.error('Sign up error:', err);
      setErro(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErro('Informe seu e-mail para receber o link de recuperação.');
      return;
    }
    try {
      setLoading(true);
      setErro(null);
      await sendPasswordReset(email.trim());
      setMensagemSucesso('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      setTimeout(() => {
        setMode('login');
        setMensagemSucesso(null);
      }, 4000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErro(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDevRole = (targetRole: 'bispado' | 'conselho') => {
    loginAsDevRole(targetRole);
    navigate('/');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 15%, rgba(37, 99, 235, 0.12), transparent 70%), var(--bg)',
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '36px 32px',
          borderRadius: 16,
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
          border: '1px solid var(--color-border)',
          background: 'var(--surface)',
        }}
      >
        {/* Top Ward Crest & Title */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
              fontSize: '1.65rem',
              fontWeight: 800,
              fontFamily: 'var(--f-display)',
            }}
          >
            B
          </div>
          <h1
            style={{
              fontFamily: 'var(--f-display)',
              margin: 0,
              fontSize: '1.7rem',
              fontWeight: 700,
              color: 'var(--ink)',
            }}
          >
            Portal Bispado &amp; Conselho
          </h1>
          <p
            style={{
              margin: '6px 0 0 0',
              color: 'var(--muted)',
              fontSize: '0.88rem',
              letterSpacing: '0.01em',
            }}
          >
            Ala Bosque • Estaca Campinas Brasil
          </p>
        </div>

        {/* Existing Active Session Banner */}
        {isLoggedIn && (
          <div
            style={{
              padding: 14,
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              marginBottom: 20,
              fontSize: '0.85rem',
              textAlign: 'center',
            }}
          >
            <div style={{ color: 'var(--muted)' }}>Você já está conectado como:</div>
            <div style={{ fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>
              {user?.displayName || user?.email} ({role})
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/')}
              style={{ width: '100%', marginTop: 10, padding: '8px 14px' }}
            >
              Ir para o Painel da Ala
            </button>
          </div>
        )}

        {/* Mode Selector Tabs (Segmented Control) */}
        <div
          style={{
            display: 'flex',
            borderRadius: 10,
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            padding: 4,
            marginBottom: 22,
            gap: 4,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErro(null);
            }}
            style={{
              flex: 1,
              background: mode === 'login' ? 'var(--surface)' : 'transparent',
              color: mode === 'login' ? 'var(--ink)' : 'var(--muted)',
              boxShadow: mode === 'login' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              fontWeight: mode === 'login' ? 700 : 500,
              border: 'none',
              padding: '9px 12px',
              borderRadius: 7,
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.15s ease',
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErro(null);
            }}
            style={{
              flex: 1,
              background: mode === 'signup' ? 'var(--surface)' : 'transparent',
              color: mode === 'signup' ? 'var(--ink)' : 'var(--muted)',
              boxShadow: mode === 'signup' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              fontWeight: mode === 'signup' ? 700 : 500,
              border: 'none',
              padding: '9px 12px',
              borderRadius: 7,
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.15s ease',
            }}
          >
            Primeiro Acesso
          </button>
        </div>

        {/* Error Alert */}
        {erro && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: 'var(--crit-soft)',
              color: 'var(--crit)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              fontSize: '0.85rem',
              marginBottom: 16,
              lineHeight: 1.45,
            }}
          >
            {erro}
          </div>
        )}

        {/* Success Alert */}
        {mensagemSucesso && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: 'var(--cons-soft)',
              color: 'var(--cons)',
              border: '1px solid rgba(22, 163, 74, 0.2)',
              fontSize: '0.85rem',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <IconCheck size={16} color="var(--cons)" />
            {mensagemSucesso}
          </div>
        )}

        {/* GOOGLE SIGN IN BUTTON */}
        {mode !== 'reset' && (
          <div style={{ marginBottom: 20 }}>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '11px 16px',
                border: '1px solid var(--line)',
                borderRadius: 9,
                background: 'var(--surface)',
                color: 'var(--ink)',
                fontSize: '0.92rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--surface-2)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--surface)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <GoogleIcon />
              {mode === 'signup' ? 'Cadastrar com Google' : 'Entrar com Google'}
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 18,
                marginBottom: 6,
              }}
            >
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                ou com e-mail
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            </div>
          </div>
        )}

        {/* MODE: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="label" style={{ margin: 0 }}>Senha</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setErro(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '0.78rem',
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Esqueci minha senha
                </button>
              </div>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: 8, padding: '12px 16px', fontSize: '0.95rem' }}
            >
              {loading ? 'Entrando...' : 'Entrar no Portal'}
            </button>
          </form>
        )}

        {/* MODE: SIGNUP */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label">Nome Completo</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: Carlos Silva"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="label">Criar Senha</label>
              <input
                type="password"
                className="input"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <label className="label">Confirmar Senha</label>
              <input
                type="password"
                className="input"
                placeholder="Repita sua senha"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--muted)',
                lineHeight: 1.45,
                background: 'var(--surface-2)',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--line)',
              }}
            >
              💡 <strong>Regra de Acesso:</strong> O primeiro líder a cadastrar-se será configurado como <strong>Bispo / Administrador</strong>. Os demais líderes terão perfil de <strong>Conselho da Ala</strong>.
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: 4, padding: '12px 16px', fontSize: '0.95rem' }}
            >
              {loading ? 'Criando conta...' : 'Criar Conta e Acessar'}
            </button>
          </form>
        )}

        {/* MODE: RESET PASSWORD */}
        {mode === 'reset' && (
          <form onSubmit={handlePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              Digite seu e-mail cadastrado. Enviaremos um link oficial do Firebase para você redefinir sua senha com segurança.
            </div>

            <div>
              <label className="label">E-mail Cadastrado</label>
              <input
                type="email"
                className="input"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px 16px', fontSize: '0.95rem' }}
            >
              {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setMode('login');
                setErro(null);
              }}
              style={{ width: '100%', padding: '8px' }}
            >
              Voltar para o Login
            </button>
          </form>
        )}

        {/* Quick Dev Switcher */}
        <div style={{ margin: '26px 0 14px 0', borderTop: '1px dashed var(--line)', position: 'relative', textAlign: 'center' }}>
          <span
            style={{
              position: 'relative',
              top: -10,
              background: 'var(--surface)',
              padding: '0 10px',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Atalho Local de Testes
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleDevRole('bispado')}
            style={{ fontSize: '0.8rem', padding: '7px 10px' }}
          >
            Simular Bispado
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleDevRole('conselho')}
            style={{ fontSize: '0.8rem', padding: '7px 10px' }}
          >
            Simular Conselho
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 22, fontSize: '0.74rem', color: 'var(--muted)' }}>
          Dados protegidos em conformidade com as diretrizes do Manual Geral.
        </div>
      </div>
    </div>
  );
};
