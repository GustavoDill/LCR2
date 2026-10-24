import React from 'react';

export const ImportarHeader: React.FC = () => {
  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', margin: 0 }}>Central de Dados & Permissões</h1>
      <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)' }}>
        Gestão de líderes da Ala, permissões granulares por organização e utilitários de sincronização
      </p>
    </div>
  );
};
