import React from 'react';
import { IconCheck } from '../../components/Icons';

interface ImportarGuidesSectionProps {
  isBishopric: boolean;
  seeding: boolean;
  seedResult: string | null;
  onSeed: () => void;
}

export const ImportarGuidesSection: React.FC<ImportarGuidesSectionProps> = ({
  isBishopric,
  seeding,
  seedResult,
  onSeed,
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
      {/* LCR Member export guide */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>1. Lista de Membros da Ala (LCR)</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          Como extrair o relatório completo de membros da ala para importar na aba <strong>Membros</strong>:
        </p>

        <ol style={{ fontSize: '0.9rem', paddingLeft: 20, lineHeight: 1.6 }}>
          <li>Acesse o sistema oficial <code>ChurchofJesusChrist.org</code> &gt; <strong>LCR</strong>.</li>
          <li>No menu superior, vá em <strong>Relatórios &gt; Lista de Membros</strong>.</li>
          <li>Selecione exibir colunas completas: Nome, Registro de Membro, Data de Nascimento, Telefone, Endereço.</li>
          <li>Clique no botão <strong>Exportar &gt; CSV ou Excel</strong>.</li>
          <li>Abra a aba <a href="/membros" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Membros</a> neste sistema e use o botão <em>&ldquo;Importar Lista LCR&rdquo;</em>.</li>
        </ol>
      </div>

      {/* LCR Seminary export guide */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>2. Relatório SIR (Seminário e Instituto)</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          Como acompanhar o progresso dos jovens e jovens adultos:
        </p>

        <ol style={{ fontSize: '0.9rem', paddingLeft: 20, lineHeight: 1.6 }}>
          <li>No LCR ou no portal <code>si.churchofjesuschrist.org</code>.</li>
          <li>Gere o relatório de <strong>Matrícula e Frequência do Seminário da Ala Bosque</strong>.</li>
          <li>Identifique jovens com frequência abaixo de 75% ou com pendência de leitura das escrituras.</li>
          <li>Lançamentos ou edições podem ser feitos na aba <a href="/seminario" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Seminário / SIR</a>.</li>
        </ol>
      </div>

      {/* Seed Card */}
      {isBishopric && (
        <div className="card" style={{ border: '1px solid var(--color-primary-light)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--color-primary)' }}>3. Inicializar / Restaurar Estrutura Padrão</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Se o banco de dados estiver vazio, você pode pré-carregar as organizações da Ala (Bispado, Quórum de Élderes, Sociedade de Socorro, Moças, Primária, Rapazes, Escola Dominical) e os orçamentos trimestrais padrão.
          </p>

          {seedResult && (
            <div
              style={{
                padding: 12,
                marginBottom: 16,
                borderRadius: 'var(--radius)',
                background: 'var(--color-surface-hover)',
                border: '1px solid var(--color-border)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <IconCheck size={16} color="var(--color-success)" />
              {seedResult}
            </div>
          )}

          <button
            onClick={onSeed}
            className="btn btn-primary"
            disabled={seeding}
            style={{ width: '100%' }}
          >
            {seeding ? 'Inicializando...' : 'Executar Carga Inicial de Dados'}
          </button>
        </div>
      )}
    </div>
  );
};
