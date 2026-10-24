import React from 'react';

interface LoginResetFormProps {
  email: string;
  setEmail: (val: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBackToLogin: () => void;
}

export const LoginResetForm: React.FC<LoginResetFormProps> = ({
  email,
  setEmail,
  loading,
  onSubmit,
  onBackToLogin,
}) => {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
        onClick={onBackToLogin}
        style={{ width: '100%', padding: '8px' }}
      >
        Voltar para o Login
      </button>
    </form>
  );
};
