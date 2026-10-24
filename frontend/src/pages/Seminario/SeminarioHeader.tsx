import React from 'react';

interface SeminarioHeaderProps {
  canWrite: boolean;
  onOpenImport: () => void;
  onRefresh: () => void;
}

export const SeminarioHeader: React.FC<SeminarioHeaderProps> = ({
  canWrite,
  onOpenImport,
  onRefresh,
}) => {
  return (
    <div
      className="head"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16,
      }}
    >
      <div>
        <h2 className="with-ico" style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
          <span
            className="h-ico"
            style={{
              display: 'inline-grid',
              placeItems: 'center',
              width: 36,
              height: 36,
              borderRadius: 10,
              color: 'var(--color-primary, #a78bfa)',
              background: 'color-mix(in srgb, var(--color-primary, #a78bfa) 15%, transparent)',
              marginRight: 10,
            }}
          >
            <svg
              className="ico"
              viewBox="0 0 24 24"
              width={20}
              height={20}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 10 12 5 2 10l10 5 10-5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </span>
          Seminário e Instituto
        </h2>
        <p className="sub" style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '13.5px' }}>
          Alunos da Ala Bosque e resultados da estaca. Somente o bispado vê esta página.
        </p>
      </div>

      {canWrite && (
        <div className="btns" style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn pri"
            onClick={onOpenImport}
          >
            Importar relatório de alunos
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={onRefresh}
          >
            Atualizar dados
          </button>
        </div>
      )}
    </div>
  );
};
