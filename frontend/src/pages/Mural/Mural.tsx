import React, { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Membro, MuralData, MuralDiscursanteDom } from '../../types';
import logoBosqueSagrado from '../../assets/logo-bosque-sagrado.png';

import {
  MESES_NOMES,
  getCurrentWeekLesson,
  getInitialMuralState,
} from './muralConstants';

import {
  buildCurrentWeekAlmoco,
  buildDiscursantesForMonth,
  getSundayOfWeek,
  normalizeAlmocoSisteres,
  parseDateFromTopo,
  resolveYearAndMonth,
} from './muralUtils';

import { MuralPoster } from './MuralPoster';
import { MuralZoomModal } from './MuralZoomModal';
import { MuralAlmocoTab } from './MuralAlmocoTab';
import { MuralDiscursantesTab } from './MuralDiscursantesTab';
import { MuralLimpezaTab } from './MuralLimpezaTab';
import { MuralEstudoTab } from './MuralEstudoTab';
import { MuralExtrasTab } from './MuralExtrasTab';

type SectionTab = 'almoco' | 'discursantes' | 'limpeza' | 'estudo' | 'extras';

export const Mural: React.FC = () => {
  const { canWrite, user } = useAuth();
  const [mural, setMural] = useState<MuralData>(getInitialMuralState);
  const [members, setMembers] = useState<Membro[]>([]);
  const [activeTab, setActiveTab] = useState<SectionTab>('almoco');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [sidebarZoom, setSidebarZoom] = useState(0.7);
  const [posterHeight, setPosterHeight] = useState(760);

  const posterRef = useRef<HTMLDivElement>(null);
  const modalPosterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (posterRef.current) {
      setPosterHeight(posterRef.current.scrollHeight || 760);
    }
  }, [mural, sidebarZoom]);

  function normalizeMuralData(raw: MuralData): MuralData {
    const { year, monthIndex } = resolveYearAndMonth(raw.dataTopo, raw.mesAlmoco);
    const refDate = parseDateFromTopo(raw.dataTopo) || new Date();
    return {
      ...raw,
      mesAlmoco: MESES_NOMES[monthIndex] || raw.mesAlmoco,
      discursantes: buildDiscursantesForMonth(year, monthIndex, raw.discursantes || []),
      almocoSisteres: normalizeAlmocoSisteres(raw.almocoSisteres, refDate),
      modoLimpeza: raw.modoLimpeza || (raw.limpezaAlaUnica ? 'ala_unica' : 'setores'),
      limpezaAlaUnica: raw.limpezaAlaUnica || 'Ala Planaltina',
      mostrarMesAlmoco: raw.mostrarMesAlmoco !== undefined ? raw.mostrarMesAlmoco : false,
      mostrarAnuncios: raw.mostrarAnuncios !== undefined ? raw.mostrarAnuncios : false,
    };
  }

  async function loadInitialData(isManualReload = false) {
    try {
      const [muralRes, membersRes] = await Promise.all([
        api.get<MuralData>('/mural').catch(err => {
          console.warn('Não foi possível obter mural do servidor:', err);
          return null;
        }),
        api.get<{ members: Membro[] }>('/membros').catch(() => ({ members: [] })),
      ]);
      if (muralRes && muralRes.almocoSisteres) {
        const normalized = normalizeMuralData(muralRes);
        setMural(normalized);
        try {
          localStorage.setItem('lcr2_mural_draft', JSON.stringify(normalized));
        } catch {
          // ignore storage quota error
        }
        if (isManualReload) {
          setStatusMsg('Mural recarregado do Firebase com sucesso!');
          setTimeout(() => setStatusMsg(''), 3500);
        }
      } else {
        const savedLocal = localStorage.getItem('lcr2_mural_draft');
        if (savedLocal) {
          try {
            setMural(normalizeMuralData(JSON.parse(savedLocal)));
          } catch {
            // keep default
          }
        }
      }
      setMembers(membersRes?.members || []);
    } catch (err) {
      console.error('Erro ao carregar dados do mural:', err);
    }
  }

  function updateMural(updater: (prev: MuralData) => MuralData) {
    setMural(prev => {
      const next = updater(prev);
      try {
        localStorage.setItem('lcr2_mural_draft', JSON.stringify(next));
      } catch {
        // ignore quota errors if image is large
      }
      return next;
    });
  }

  function handleDataTopoChange(newDataTopo: string) {
    updateMural(prev => {
      const { year, monthIndex } = resolveYearAndMonth(newDataTopo, undefined);
      const parsedParts = newDataTopo.trim().split(/[/-]/);
      const hasValidMonth =
        parsedParts.length >= 2 &&
        !isNaN(parseInt(parsedParts[1], 10)) &&
        parseInt(parsedParts[1], 10) >= 1 &&
        parseInt(parsedParts[1], 10) <= 12;

      if (!hasValidMonth) {
        return { ...prev, dataTopo: newDataTopo };
      }

      const topoDate = parseDateFromTopo(newDataTopo);
      const updatedAlmoco = topoDate
        ? buildCurrentWeekAlmoco(topoDate, prev.almocoSisteres)
        : prev.almocoSisteres;

      return {
        ...prev,
        dataTopo: newDataTopo,
        mesAlmoco: MESES_NOMES[monthIndex],
        discursantes: buildDiscursantesForMonth(year, monthIndex, prev.discursantes),
        almocoSisteres: updatedAlmoco,
      };
    });
  }

  function handleFillCurrentWeekAlmoco() {
    const today = new Date();
    const sunday = getSundayOfWeek(today);
    const sundayDd = String(sunday.getDate()).padStart(2, '0');
    const sundayMm = String(sunday.getMonth() + 1).padStart(2, '0');
    const yy = String(sunday.getFullYear()).slice(-2);
    const newSundayTopo = `${sundayDd}/${sundayMm}/${yy}`;
    const newMes = MESES_NOMES[sunday.getMonth()];

    updateMural(prev => {
      const { year, monthIndex } = resolveYearAndMonth(newSundayTopo, newMes);
      const baseExisting = prev.almocoSisteres.map((item, idx) => {
        if (idx === 0) return { ...item, destaque: true };
        return item;
      });
      return {
        ...prev,
        dataTopo: newSundayTopo,
        mesAlmoco: newMes,
        almocoSisteres: buildCurrentWeekAlmoco(today, baseExisting),
        discursantes: buildDiscursantesForMonth(year, monthIndex, prev.discursantes),
      };
    });
    setStatusMsg('Almoço das Sisteres preenchido para a semana atual (P-Day com faixa)!');
    setTimeout(() => setStatusMsg(''), 3500);
  }

  function handleMonthChange(newMesNome: string) {
    updateMural(prev => {
      const { year, monthIndex } = resolveYearAndMonth(prev.dataTopo, newMesNome);
      const updatedDiscursantes = buildDiscursantesForMonth(year, monthIndex, prev.discursantes);
      const parts = prev.dataTopo.trim().split('/');
      let nextDataTopo = prev.dataTopo;
      if (parts.length >= 2) {
        parts[1] = String(monthIndex + 1).padStart(2, '0');
        nextDataTopo = parts.join('/');
      }
      return {
        ...prev,
        mesAlmoco: newMesNome,
        dataTopo: nextDataTopo,
        discursantes: updatedDiscursantes,
      };
    });
  }

  async function handleSaveServer() {
    if (user && canWrite === false) {
      alert('Seu perfil de usuário não tem permissão para salvar alterações no mural.');
      return;
    }
    setSaving(true);
    setStatusMsg('');
    try {
      const saved = await api.put<MuralData>('/mural', mural);
      if (saved) {
        const normalized = normalizeMuralData(saved);
        setMural(normalized);
        try {
          localStorage.setItem('lcr2_mural_draft', JSON.stringify(normalized));
        } catch {
          // ignore quota
        }
      }
      setStatusMsg('Mural salvo com sucesso no Firebase!');
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err: any) {
      console.error('Erro ao salvar mural no Firebase:', err);
      alert(err.message || 'Erro ao salvar mural no Firebase.');
    } finally {
      setSaving(false);
    }
  }

  function handleSelectCurrentWeekStudy() {
    const cur = getCurrentWeekLesson();
    updateMural(prev => ({
      ...prev,
      estudoSemana: {
        ...prev.estudoSemana,
        periodo: cur.periodo,
        escrituras: cur.escrituras,
        tema: cur.tema,
      },
    }));
    setStatusMsg(`Estudo atualizado para a semana atual (${cur.periodo})!`);
    setTimeout(() => setStatusMsg(''), 3500);
  }

  async function handleDownloadPng() {
    const targetEl = posterRef.current || modalPosterRef.current;
    if (!targetEl) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(targetEl, {
        cacheBust: true,
        pixelRatio: 2,
        width: 540,
        height: targetEl.scrollHeight || 760,
        style: {
          transform: 'none',
          transformOrigin: 'top left',
        },
      });
      const link = document.createElement('a');
      const safeDate = (mural.dataTopo || 'mural').replace(/[^0-9a-zA-Z_-]/g, '-');
      link.download = `mural-ala-bosque-${safeDate}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erro ao gerar imagem PNG:', err);
      alert('Não foi possível exportar a imagem PNG. Verifique a imagem enviada e tente novamente.');
    } finally {
      setExporting(false);
    }
  }

  // Agrupa os domingos (4 ou 5) em pares de colunas para o Cartaz
  const discursantesPairs: MuralDiscursanteDom[][] = [];
  for (let i = 0; i < mural.discursantes.length; i += 2) {
    discursantesPairs.push(mural.discursantes.slice(i, i + 2));
  }
  const hasFiveSundays = mural.discursantes.length >= 5;

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h2>Mural Semanal</h2>
          <p className="sub">
            Edite as informações semanais da Ala Bosque Sagrado, acompanhe no pequeno Preview ao lado e baixe a imagem pronta.
          </p>
        </div>
        <div className="btns">
          {statusMsg && (
            <span className="badge badge-success" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
              ✓ {statusMsg}
            </span>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => loadInitialData(true)}
            title="Recarregar os dados mais recentes gravados no Firebase"
          >
            🔄 Recarregar
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSaveServer}
            disabled={saving}
            title="Salvar alterações no banco de dados Firebase"
          >
            {saving ? 'Salvando no Firebase…' : '💾 Salvar no Firebase'}
          </button>
          <button type="button" className="btn pri" onClick={handleDownloadPng} disabled={exporting}>
            {exporting ? 'Gerando imagem…' : '⬇️ Baixar Imagem (PNG)'}
          </button>
        </div>
      </div>

      {/* Datalist global de membros para autocompletar */}
      <datalist id="mural-membros-list">
        {members.map(m => (
          <option key={m.id} value={m.nome}>
            {m.chamado ? `${m.nome} (${m.chamado})` : m.nome}
          </option>
        ))}
      </datalist>

      <div className="mural-layout">
        {/* COLUNA ESQUERDA: Editor por Seções */}
        <div className="stack">
          {/* Seletor rápido de abas de edição */}
          <div className="mural-tabs" role="tablist">
            <button
              type="button"
              className={`mural-tab-btn ${activeTab === 'almoco' ? 'on' : ''}`}
              onClick={() => setActiveTab('almoco')}
            >
              🍽️ Almoço das Sisteres
            </button>
            <button
              type="button"
              className={`mural-tab-btn ${activeTab === 'discursantes' ? 'on' : ''}`}
              onClick={() => setActiveTab('discursantes')}
            >
              🎙️ Discursantes ({mural.discursantes.length} dom)
            </button>
            <button
              type="button"
              className={`mural-tab-btn ${activeTab === 'limpeza' ? 'on' : ''}`}
              onClick={() => setActiveTab('limpeza')}
            >
              🧹 Limpeza da Capela
            </button>
            <button
              type="button"
              className={`mural-tab-btn ${activeTab === 'estudo' ? 'on' : ''}`}
              onClick={() => setActiveTab('estudo')}
            >
              📖 Estudo da Semana
            </button>
            <button
              type="button"
              className={`mural-tab-btn ${activeTab === 'extras' ? 'on' : ''}`}
              onClick={() => setActiveTab('extras')}
            >
              ⚙️ Topo & Anúncios
            </button>
          </div>

          {/* Barra rápida de Data do Cartaz e Mês */}
          <section className="card" style={{ padding: '14px 18px' }}>
            <div className="two">
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Data no Topo da Imagem (DD/MM/AA)</label>
                <input
                  className="inp"
                  value={mural.dataTopo}
                  onChange={e => handleDataTopoChange(e.target.value)}
                  placeholder="Ex.: 25/10/26"
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Mês de Referência (Calcula os 4 ou 5 Domingos)</label>
                <select
                  className="inp"
                  value={mural.mesAlmoco}
                  onChange={e => handleMonthChange(e.target.value)}
                >
                  {MESES_NOMES.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* ABA 1: ALMOÇO DAS SISTERES */}
          {activeTab === 'almoco' && (
            <MuralAlmocoTab
              mural={mural}
              updateMural={updateMural}
              onFillCurrentWeek={handleFillCurrentWeekAlmoco}
            />
          )}

          {/* ABA 2: DISCURSANTES */}
          {activeTab === 'discursantes' && (
            <MuralDiscursantesTab
              mural={mural}
              updateMural={updateMural}
            />
          )}

          {/* ABA 3: LIMPEZA DA CAPELA & PÃO DO SACRAMENTO */}
          {activeTab === 'limpeza' && (
            <MuralLimpezaTab
              mural={mural}
              updateMural={updateMural}
            />
          )}

          {/* ABA 4: ESTUDO DA SEMANA */}
          {activeTab === 'estudo' && (
            <MuralEstudoTab
              mural={mural}
              updateMural={updateMural}
              onSelectCurrentWeekStudy={handleSelectCurrentWeekStudy}
            />
          )}

          {/* ABA 5: EXTRAS (CABEÇALHO E ANÚNCIOS) */}
          {activeTab === 'extras' && (
            <MuralExtrasTab
              mural={mural}
              updateMural={updateMural}
              logoBosqueSagrado={logoBosqueSagrado}
            />
          )}

          {/* BARRA DE AÇÕES INFERIOR */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: 8,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
              {statusMsg ? (
                <span className="badge badge-success">✓ {statusMsg}</span>
              ) : (
                <span>As alterações são sincronizadas com o Firebase ao clicar em Salvar.</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleSaveServer}
                disabled={saving}
              >
                {saving ? 'Salvando no Firebase…' : '💾 Salvar no Firebase'}
              </button>
              <button
                type="button"
                className="btn pri"
                onClick={handleDownloadPng}
                disabled={exporting}
              >
                {exporting ? 'Gerando…' : '⬇️ Baixar Imagem'}
              </button>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: Preview Ao Vivo & Miniatura */}
        <div className="mural-preview-sticky">
          <section className="card stack" style={{ padding: 16, gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: 4 }}>
                  Preview Ao Vivo
                </span>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Miniatura do Cartaz</h3>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary sm"
                  onClick={() => setIsZoomModalOpen(true)}
                  title="Ampliar cartaz para leitura confortável"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
                >
                  🔍 Ampliar
                </button>
                <button
                  type="button"
                  className="btn pri sm"
                  onClick={handleDownloadPng}
                  disabled={exporting}
                >
                  {exporting ? 'Gerando…' : '⬇️ Baixar PNG'}
                </button>
              </div>
            </div>

            {/* SELETOR RÁPIDO DE ZOOM NA LATERAL */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                background: 'var(--color-surface-hover)',
                borderRadius: 6,
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Zoom:</span>
                <button
                  type="button"
                  className={`chip sm ${sidebarZoom === 0.7 ? 'active' : ''}`}
                  onClick={() => setSidebarZoom(0.7)}
                  style={{ cursor: 'pointer', padding: '1px 6px', fontSize: '0.72rem' }}
                >
                  70%
                </button>
                <button
                  type="button"
                  className={`chip sm ${sidebarZoom === 0.85 ? 'active' : ''}`}
                  onClick={() => setSidebarZoom(0.85)}
                  style={{ cursor: 'pointer', padding: '1px 6px', fontSize: '0.72rem' }}
                >
                  85%
                </button>
                <button
                  type="button"
                  className={`chip sm ${sidebarZoom === 1.0 ? 'active' : ''}`}
                  onClick={() => setSidebarZoom(1.0)}
                  style={{ cursor: 'pointer', padding: '1px 6px', fontSize: '0.72rem' }}
                >
                  100%
                </button>
              </div>

              <button
                type="button"
                className="btn ghost sm"
                onClick={() => setIsZoomModalOpen(true)}
                style={{ fontSize: '0.72rem', padding: '2px 6px', color: 'var(--color-text-muted)' }}
                title="Abrir em tela cheia para leitura detalhada"
              >
                ⛶ Tela Cheia
              </button>
            </div>

            <div className="mural-preview-stage" data-testid="mural-preview-container">
              <div
                className="mural-preview-scale-box"
                style={{
                  width: Math.round(540 * sidebarZoom),
                  height: Math.round(posterHeight * sidebarZoom),
                  transition: 'width 0.15s ease, height 0.15s ease',
                }}
              >
                <MuralPoster
                  mural={mural}
                  logoBosqueSagrado={logoBosqueSagrado}
                  discursantesPairs={discursantesPairs}
                  hasFiveSundays={hasFiveSundays}
                  posterRef={posterRef}
                  scale={sidebarZoom}
                  clickable={true}
                  onClick={() => setIsZoomModalOpen(true)}
                />
                <button
                  type="button"
                  className="mural-preview-overlay-btn"
                  onClick={() => setIsZoomModalOpen(true)}
                  title="Clique para ampliar o cartaz"
                >
                  🔍 Ampliar
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* MODAL DE AMPLIAÇÃO / TELA CHEIA */}
      <MuralZoomModal
        isOpen={isZoomModalOpen}
        onClose={() => setIsZoomModalOpen(false)}
        mural={mural}
        posterHeight={posterHeight}
        logoBosqueSagrado={logoBosqueSagrado}
        discursantesPairs={discursantesPairs}
        hasFiveSundays={hasFiveSundays}
        modalPosterRef={modalPosterRef}
        onDownloadPng={handleDownloadPng}
        exporting={exporting}
      />
    </div>
  );
};
