import React, { useRef } from 'react';
import { MuralData } from '../../types';

interface MuralExtrasTabProps {
  mural: MuralData;
  updateMural: (updater: (prev: MuralData) => MuralData) => void;
  logoBosqueSagrado: string;
}

export const MuralExtrasTab: React.FC<MuralExtrasTabProps> = ({
  mural,
  updateMural,
  logoBosqueSagrado,
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      updateMural(prev => ({
        ...prev,
        logoUrl: result,
      }));
    };
    reader.readAsDataURL(file);
  }

  return (
    <section className="card stack">
      <div>
        <h3>Cabeçalho (Logotipo / Instituto / Seminário) & Anúncios</h3>
        <p className="sub">Ajuste os horários fixos do topo, o logotipo oficial ou os anúncios do rodapé do cartaz.</p>
      </div>

      <div className="field">
        <label>Logotipo Oficial do Topo (Faixa Bosque Sagrado)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <img
            src={mural.logoUrl || logoBosqueSagrado}
            alt="Logo Bosque Sagrado"
            style={{
              height: 44,
              objectFit: 'contain',
              background: '#f5f5f4',
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid var(--color-border)',
            }}
          />
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="inp"
            style={{ maxWidth: 280 }}
          />
          {mural.logoUrl && (
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => {
                if (logoInputRef.current) logoInputRef.current.value = '';
                updateMural(p => ({ ...p, logoUrl: '' }));
              }}
            >
              Restaurar Logo Padrão
            </button>
          )}
        </div>
        <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: 4 }}>
          O logotipo esculpido oficial da Ala Bosque Sagrado já está configurado por padrão.
        </small>
      </div>

      <div className="two">
        <div className="field">
          <label>Horários do Instituto</label>
          <textarea
            className="inp"
            rows={3}
            value={mural.institutoTexto}
            onChange={e => updateMural(p => ({ ...p, institutoTexto: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Horários do Seminário</label>
          <textarea
            className="inp"
            rows={3}
            value={mural.seminarioTexto}
            onChange={e => updateMural(p => ({ ...p, seminarioTexto: e.target.value }))}
          />
        </div>
      </div>

      <div className="field" style={{ paddingTop: 10, borderTop: '1px solid var(--color-border)', marginBottom: 6 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={mural.mostrarAnuncios !== false}
            onChange={e => updateMural(p => ({ ...p, mostrarAnuncios: e.target.checked }))}
          />
          📢 Exibir rodapé de Anúncios no Cartaz
        </label>
        <small style={{ color: 'var(--color-text-muted)' }}>
          Desmarque para ocultar a seção de anúncios no rodapé (como no modelo sem anúncios).
        </small>
      </div>

      {mural.mostrarAnuncios !== false && (
        <div className="two">
          {mural.anuncios.map((an, idx) => (
            <div key={idx} className="stack" style={{ gap: 8 }}>
              <div className="field">
                <label>Anúncio {idx + 1} — Título</label>
                <textarea
                  className="inp"
                  rows={2}
                  value={an.titulo}
                  onChange={e => {
                    const val = e.target.value;
                    updateMural(p => {
                      const list = [...p.anuncios];
                      list[idx] = { ...list[idx], titulo: val };
                      return { ...p, anuncios: list };
                    });
                  }}
                />
              </div>
              <div className="field">
                <label>Anúncio {idx + 1} — Texto</label>
                <textarea
                  className="inp"
                  rows={3}
                  value={an.texto}
                  onChange={e => {
                    const val = e.target.value;
                    updateMural(p => {
                      const list = [...p.anuncios];
                      list[idx] = { ...list[idx], texto: val };
                      return { ...p, anuncios: list };
                    });
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
