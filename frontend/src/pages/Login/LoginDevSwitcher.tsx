import React from 'react';
import { DevRoleOption } from '../../context/AuthContext';

interface LoginDevSwitcherProps {
  onDevRole: (role: DevRoleOption) => void;
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
          Simulação de Papéis (Desenvolvimento)
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button
          type="button"
          className="btn btn-secondary sm"
          onClick={() => onDevRole('bispado')}
          style={{ fontSize: '0.76rem', padding: '6px 8px' }}
          title="Acesso total de escrita a todos os módulos"
        >
          🏛️ Simular Bispado
        </button>
        <button
          type="button"
          className="btn btn-secondary sm"
          onClick={() => onDevRole('lider_org')}
          style={{ fontSize: '0.76rem', padding: '6px 8px' }}
          title="Acesso de líder de organização"
        >
          🤝 Simular Líder Org
        </button>
        <button
          type="button"
          className="btn btn-secondary sm"
          onClick={() => onDevRole('conselho')}
          style={{ fontSize: '0.76rem', padding: '6px 8px' }}
          title="Acesso padrão de conselho da ala"
        >
          👥 Simular Conselho
        </button>
        <button
          type="button"
          className="btn btn-secondary sm"
          onClick={() => onDevRole('sem_acesso')}
          style={{ fontSize: '0.76rem', padding: '6px 8px', color: 'var(--color-danger, #dc2626)' }}
          title="Usuário ativo com zero permissões concedidas"
        >
          🔒 Simular Sem Acesso
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 18, fontSize: '0.74rem', color: 'var(--muted)' }}>
        Dados protegidos em conformidade com as diretrizes do Manual Geral.
      </div>
    </>
  );
};
