import React from 'react';

interface LoginFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  onSubmit,
  onForgotPassword,
}) => {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            onClick={onForgotPassword}
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
  );
};
