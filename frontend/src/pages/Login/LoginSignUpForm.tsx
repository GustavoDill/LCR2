import React from 'react';

interface LoginSignUpFormProps {
  displayName: string;
  setDisplayName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const LoginSignUpForm: React.FC<LoginSignUpFormProps> = ({
  displayName,
  setDisplayName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
  );
};
