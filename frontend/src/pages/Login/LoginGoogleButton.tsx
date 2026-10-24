import React from 'react';
import { GoogleIcon } from './loginIcons';

interface LoginGoogleButtonProps {
  mode: 'login' | 'signup' | 'reset';
  loading: boolean;
  onGoogleLogin: () => void;
}

export const LoginGoogleButton: React.FC<LoginGoogleButtonProps> = ({
  mode,
  loading,
  onGoogleLogin,
}) => {
  if (mode === 'reset') return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        type="button"
        onClick={onGoogleLogin}
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
  );
};
