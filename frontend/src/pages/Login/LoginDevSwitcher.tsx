import React from 'react';

interface LoginDevSwitcherProps {
  onDevRole: (role: 'bispado' | 'conselho') => void;
}

export const LoginDevSwitcher: React.FC<LoginDevSwitcherProps> = ({ onDevRole }) => {
  return (
    <>
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
          onClick={() => onDevRole('bispado')}
          style={{ fontSize: '0.8rem', padding: '7px 10px' }}
        >
          Simular Bispado
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onDevRole('conselho')}
          style={{ fontSize: '0.8rem', padding: '7px 10px' }}
        >
          Simular Conselho
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 22, fontSize: '0.74rem', color: 'var(--muted)' }}>
        Dados protegidos em conformidade com as diretrizes do Manual Geral.
      </div>
    </>
  );
};
