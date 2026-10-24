import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IconCheck } from '../../components/Icons';
import { getFriendlyErrorMessage } from './loginUtils';
import { LoginHeader } from './LoginHeader';
import { LoginGoogleButton } from './LoginGoogleButton';
import { LoginForm } from './LoginForm';
import { LoginSignUpForm } from './LoginSignUpForm';
import { LoginResetForm } from './LoginResetForm';
import { LoginDevSwitcher } from './LoginDevSwitcher';

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

  const handleDevRole = (targetRole: any) => {
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
        <LoginHeader
          isLoggedIn={isLoggedIn}
          userName={user?.displayName || user?.email}
          userRole={role}
          onNavigateHome={() => navigate('/')}
        />

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
        <LoginGoogleButton
          mode={mode}
          loading={loading}
          onGoogleLogin={handleGoogleLogin}
        />

        {/* MODE: LOGIN */}
        {mode === 'login' && (
          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            loading={loading}
            onSubmit={handleLogin}
            onForgotPassword={() => {
              setMode('reset');
              setErro(null);
            }}
          />
        )}

        {/* MODE: SIGNUP */}
        {mode === 'signup' && (
          <LoginSignUpForm
            displayName={displayName}
            setDisplayName={setDisplayName}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            loading={loading}
            onSubmit={handleSignUp}
          />
        )}

        {/* MODE: RESET PASSWORD */}
        {mode === 'reset' && (
          <LoginResetForm
            email={email}
            setEmail={setEmail}
            loading={loading}
            onSubmit={handlePasswordReset}
            onBackToLogin={() => {
              setMode('login');
              setErro(null);
            }}
          />
        )}

        <LoginDevSwitcher onDevRole={handleDevRole} />
      </div>
    </div>
  );
};
