import React, { useRef } from 'react';
import { MuralData } from '../../types';
import { COME_FOLLOW_ME_2026_LESSONS, COME_FOLLOW_ME_2026_URL } from './muralConstants';

interface MuralEstudoTabProps {
  mural: MuralData;
  updateMural: (updater: (prev: MuralData) => MuralData) => void;
  onSelectCurrentWeekStudy: () => void;
}

export const MuralEstudoTab: React.FC<MuralEstudoTabProps> = ({
  mural,
  updateMural,
  onSelectCurrentWeekStudy,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      updateMural(prev => ({
        ...prev,
        estudoSemana: {
          ...prev.estudoSemana,
          imagemDataUrl: result,
        },
      }));
    };
    reader.readAsDataURL(file);
  }

  return (
    <section className="card stack">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div>
          <h3>Estudo da Semana (Vem, e Segue-Me 2026)</h3>
          <p className="sub">
            Acesse o manual oficial de 2026 para baixar a imagem da semana e faça o upload abaixo.
          </p>
        </div>
        <a
          href={COME_FOLLOW_ME_2026_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn pri sm"
          style={{ textDecoration: 'none' }}
        >
          🔗 Abrir Vem, e Segue-Me 2026 ↗
        </a>
      </div>

      <div
        style={{
          padding: '12px 14px',
          borderRadius: 8,
          background: 'var(--color-primary-light)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ fontSize: '0.85rem' }}>
          <strong>Preenchimento rápido da semana:</strong> selecione qualquer lição de 2026 ou aplique a semana atual.
        </div>
        <button type="button" className="btn btn-secondary sm" onClick={onSelectCurrentWeekStudy}>
          📅 Usar Semana Atual
        </button>
      </div>

      <div className="field">
        <label>Selecionar Lição do Manual Vem, e Segue-Me (Velho Testamento 2026)</label>
        <select
          className="inp"
          value={
            COME_FOLLOW_ME_2026_LESSONS.find(l => l.escrituras === mural.estudoSemana.escrituras)?.id || ''
          }
          onChange={e => {
            const found = COME_FOLLOW_ME_2026_LESSONS.find(l => l.id === e.target.value);
            if (found) {
              updateMural(p => ({
                ...p,
                estudoSemana: {
                  ...p.estudoSemana,
                  periodo: found.periodo,
                  escrituras: found.escrituras,
                  tema: found.tema,
                },
              }));
            }
          }}
        >
          <option value="">-- Personalizado / Escolher da lista --</option>
          {COME_FOLLOW_ME_2026_LESSONS.map(l => (
            <option key={l.id} value={l.id}>
              {l.periodo} — {l.escrituras} ({l.tema})
            </option>
          ))}
        </select>
      </div>

      <div className="two">
        <div className="field">
          <label>Referência das Escrituras (Texto Azul)</label>
          <input
            className="inp"
            value={mural.estudoSemana.escrituras}
            onChange={e =>
              updateMural(p => ({
                ...p,
                estudoSemana: { ...p.estudoSemana, escrituras: e.target.value },
              }))
            }
            placeholder="Ex.: Isaías 40–49"
          />
        </div>
        <div className="field">
          <label>Tema / Citação (Texto Laranja)</label>
          <input
            className="inp"
            value={mural.estudoSemana.tema}
            onChange={e =>
              updateMural(p => ({
                ...p,
                estudoSemana: { ...p.estudoSemana, tema: e.target.value },
              }))
            }
            placeholder="Ex.: “Consolai o meu povo”"
          />
        </div>
      </div>

      <div className="field">
        <label>Upload da Imagem do Estudo da Semana</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="inp"
            style={{ maxWidth: 340 }}
          />
          {mural.estudoSemana.imagemDataUrl && (
            <button
              type="button"
              className="btn ghost danger sm"
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                updateMural(p => ({
                  ...p,
                  estudoSemana: { ...p.estudoSemana, imagemDataUrl: '' },
                }));
              }}
            >
              Remover Imagem
            </button>
          )}
        </div>
        <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: 4 }}>
          1. Clique em <b>“Abrir Vem, e Segue-Me 2026”</b> acima • 2. Salve a imagem da lição da semana atual no seu dispositivo • 3. Selecione o arquivo aqui.
        </small>
      </div>
    </section>
  );
};
