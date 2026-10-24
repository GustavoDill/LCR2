import React from 'react';
import { MuralData, MuralDiscursanteDom } from '../../types';

interface MuralPosterProps {
  mural: MuralData;
  logoBosqueSagrado: string;
  discursantesPairs: MuralDiscursanteDom[][];
  hasFiveSundays: boolean;
  posterRef?: React.Ref<HTMLDivElement>;
  scale?: number;
  clickable?: boolean;
  onClick?: () => void;
}

export const MuralPoster: React.FC<MuralPosterProps> = ({
  mural,
  logoBosqueSagrado,
  discursantesPairs,
  hasFiveSundays,
  posterRef,
  scale = 1,
  clickable = false,
  onClick,
}) => {
  return (
    <div
      ref={posterRef}
      className={`mural-poster ${clickable ? 'mural-preview-clickable' : ''}`}
      data-testid="mural-poster-canvas"
      onClick={onClick}
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
    >
      {/* TOPO DO CARTAZ */}
      <div className="mural-poster-header">
        <div className="mural-poster-date">{mural.dataTopo}</div>
        <div className="mural-banner-wrap">
          <img
            src={mural.logoUrl || logoBosqueSagrado}
            alt={mural.alaTitulo || 'BOSQUE SAGRADO'}
            className="mural-banner-img"
          />
        </div>

        <div className="mural-inst-sem-row">
          <div>
            <div className="mural-yellow-title" style={{ fontSize: 20 }}>
              INSTITUTO
            </div>
            <div className="mural-yellow-sub">{mural.institutoTexto}</div>
          </div>
          <div>
            <div className="mural-yellow-title" style={{ fontSize: 20 }}>
              SEMINARIO
            </div>
            <div className="mural-yellow-sub">{mural.seminarioTexto}</div>
          </div>
        </div>
      </div>

      <div className="mural-divider-h" />

      {/* 4 QUADRANTES */}
      <div className="mural-quadrants">
        {/* Q1: Almoço das Sisteres */}
        <div className="mural-quad mural-quad-tl">
          <div style={{ textAlign: 'center' }}>
            <div className="mural-yellow-title" style={{ fontSize: 21 }}>
              Almoço das Sisteres
            </div>
            {mural.mostrarMesAlmoco && mural.mesAlmoco && (
              <div className="mural-yellow-title" style={{ fontSize: 15, marginTop: 1 }}>
                {mural.mesAlmoco}
              </div>
            )}
          </div>

          <div className="mural-almoco-list">
            {mural.almocoSisteres.map((row, idx) => (
              <div
                key={idx}
                className={`mural-almoco-row ${row.destaque ? 'highlight' : ''}`}
              >
                <div>• {row.dia}</div>
                <div style={{ textAlign: 'center' }}>{row.diaSemana}</div>
                <div style={{ textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {row.responsavel || ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Q2: Discursantes (4 ou 5 Domingos do Mês) */}
        <div className="mural-quad mural-quad-tr">
          <div style={{ textAlign: 'center', marginBottom: hasFiveSundays ? 3 : 6 }}>
            <div className="mural-yellow-title" style={{ fontSize: 21 }}>
              Discursantes
            </div>
          </div>

          {discursantesPairs.map((pair, pIdx) => (
            <div
              key={pIdx}
              className="mural-disc-pair"
              style={{ marginTop: hasFiveSundays ? 3 : 6 }}
            >
              <div
                className="mural-disc-bar"
                style={{ fontSize: hasFiveSundays ? 10 : 11 }}
              >
                <div>{pair[0]?.data || ''}</div>
                <div>{pair[1]?.data || ''}</div>
              </div>
              <div
                className="mural-disc-names"
                style={{
                  fontSize: hasFiveSundays ? 10 : 11,
                  padding: hasFiveSundays ? '2px 4px 3px' : '4px 4px 6px',
                }}
              >
                <div>{pair[0]?.nomes || ''}</div>
                <div>{pair[1]?.nomes || ''}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Q3: Limpeza da Capela & Pão do Sacramento */}
        <div className="mural-quad mural-quad-bl">
          <div>
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
              <div className="mural-yellow-title" style={{ fontSize: 21 }}>
                Limpeza da Capela
              </div>
            </div>

            {mural.modoLimpeza === 'ala_unica' ? (
              <div className="mural-limpeza-ala-unica-box">
                <span className="mural-stroke-white" style={{ fontSize: 18, letterSpacing: '0.02em' }}>
                  {mural.limpezaAlaUnica || 'Ala Planaltina'}
                </span>
              </div>
            ) : (
              <div className="mural-limpeza-list">
                {mural.limpezaCapela.map((l, idx) => (
                  <div key={idx} className="mural-limpeza-row">
                    <span className="mural-stroke-white">{l.responsavel}</span>
                    <span style={{ fontWeight: 800 }}> - </span>
                    <span className="mural-stroke-cyan">{l.local}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: mural.modoLimpeza === 'ala_unica' ? 24 : 10 }}>
            <div className="mural-yellow-title" style={{ fontSize: 16 }}>
              Pão do Sacramento
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                fontStyle: 'italic',
                marginTop: 4,
                color: '#111111',
              }}
            >
              {mural.paoSacramento}
            </div>
          </div>
        </div>

        {/* Q4: Estudo da Semana */}
        <div className="mural-quad mural-quad-br">
          <div style={{ width: '100%' }}>
            <div className="mural-yellow-title" style={{ fontSize: 21 }}>
              Estudo da Semana
            </div>
            <div className="mural-stroke-cyan" style={{ fontSize: 14, marginTop: 6 }}>
              {mural.estudoSemana.escrituras}
            </div>
          </div>

          <div className="mural-estudo-img-box">
            {mural.estudoSemana.imagemDataUrl ? (
              <img
                src={mural.estudoSemana.imagemDataUrl}
                alt={mural.estudoSemana.escrituras}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background:
                    'radial-gradient(circle at 50% 35%, #fef3c7 0%, #b45309 55%, #451a03 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 10,
                  fontSize: 11,
                  fontStyle: 'italic',
                }}
              >
                <span style={{ fontSize: 24, marginBottom: 4 }}>📖</span>
                <span>Faça upload da imagem da semana na aba "Estudo da Semana"</span>
              </div>
            )}
          </div>

          <div className="mural-stroke-orange" style={{ fontSize: 12.5, paddingInline: 4 }}>
            {mural.estudoSemana.tema}
          </div>
        </div>
      </div>

      {/* RODAPÉ: Anúncios (opcional) */}
      {mural.mostrarAnuncios && mural.anuncios && mural.anuncios.length > 0 && (
        <>
          <div className="mural-divider-h" />
          <div className="mural-footer">
            <div style={{ textAlign: 'center' }}>
              <span className="mural-yellow-title" style={{ fontSize: 14 }}>
                Anúncios
              </span>
            </div>
            <div className="mural-anuncios-grid">
              {mural.anuncios.map((an, idx) => (
                <div key={idx}>
                  <div style={{ fontWeight: 800, whiteSpace: 'pre-line' }}>• {an.titulo}</div>
                  <div style={{ marginTop: 2, whiteSpace: 'pre-line' }}>{an.texto}</div>
                  {an.link && (
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 7.5,
                        wordBreak: 'break-all',
                        fontWeight: 700,
                      }}
                    >
                      {an.link}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
