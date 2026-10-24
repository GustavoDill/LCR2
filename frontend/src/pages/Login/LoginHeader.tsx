import React from 'react';

interface LoginHeaderProps {
  isLoggedIn: boolean;
  userName?: string | null;
  userRole?: string | null;
  onNavigateHome: () => void;
}

export const LoginHeader: React.FC<LoginHeaderProps> = ({
  isLoggedIn,
  userName,
  userRole,
  onNavigateHome,
}) => {
  return (
    <>
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
            {userName} ({userRole})
          </div>
          <button
            className="btn btn-primary"
            onClick={onNavigateHome}
            style={{ width: '100%', marginTop: 10, padding: '8px 14px' }}
          >
            Ir para o Painel da Ala
          </button>
        </div>
      )}
    </>
  );
};
