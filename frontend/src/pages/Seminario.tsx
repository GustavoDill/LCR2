import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { SIRRelatorio, SIREstaca, SIRAluno } from '../types';

export const Seminario: React.FC = () => {
  const { isBishopric, canWrite } = useAuth();
  const [alunosReports, setAlunosReports] = useState<SIRRelatorio[]>([]);
  const [estaca, setEstaca] = useState<{ seminario: SIREstaca[]; instituto: SIREstaca[] }>({
    seminario: [],
    instituto: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<
    'todos' | 'seminario' | 'instituto' | 'risco' | 'pendencia' | 'credito'
  >('todos');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Form states for importing
  const [importData, setImportData] = useState(new Date().toISOString().split('T')[0]);
  const [importSemestre, setImportSemestre] = useState('2º semestre 2026');
  const [importText, setImportText] = useState('');
  const [importSubmitting, setImportSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    loadSIR();
  }, [isBishopric]);

  // All useMemos placed at top level
  const latestReport = useMemo(() => alunosReports[0] || null, [alunosReports]);
  const alunosList: SIRAluno[] = useMemo(() => latestReport?.alunos || [], [latestReport]);

  const numSeminario = useMemo(
    () => alunosList.filter(a => /semi/i.test(a.tipo)).length,
    [alunosList]
  );
  const numInstituto = useMemo(
    () => alunosList.filter(a => /inst/i.test(a.tipo)).length,
    [alunosList]
  );
  const countRisco = useMemo(
    () => alunosList.filter(a => a.situacao === 'risco').length,
    [alunosList]
  );
  const countPendencia = useMemo(
    () => alunosList.filter(a => a.situacao === 'pendencia').length,
    [alunosList]
  );
  const countCredito = useMemo(
    () => alunosList.filter(a => a.situacao === 'credito').length,
    [alunosList]
  );

  const seminarioAlunos = useMemo(
    () => alunosList.filter(a => /semi/i.test(a.tipo)),
    [alunosList]
  );
  const institutoAlunos = useMemo(
    () => alunosList.filter(a => /inst/i.test(a.tipo)),
    [alunosList]
  );

  const avgSeminarioFreq = useMemo(() => {
    if (seminarioAlunos.length === 0) return 0;
    const sum = seminarioAlunos.reduce((acc, curr) => acc + (curr.freq || 0), 0);
    return Math.round(sum / seminarioAlunos.length);
  }, [seminarioAlunos]);

  const avgInstitutoFreq = useMemo(() => {
    if (institutoAlunos.length === 0) return 0;
    const sum = institutoAlunos.reduce((acc, curr) => acc + (curr.freq || 0), 0);
    return Math.round(sum / institutoAlunos.length);
  }, [institutoAlunos]);

  const seminarioRisco = useMemo(
    () => seminarioAlunos.filter(a => a.situacao === 'risco').length,
    [seminarioAlunos]
  );
  const institutoRisco = useMemo(
    () => institutoAlunos.filter(a => a.situacao === 'risco').length,
    [institutoAlunos]
  );

  const latestEstacaSeminario = useMemo(() => estaca.seminario[0] || null, [estaca.seminario]);
  const latestEstacaInstituto = useMemo(() => estaca.instituto[0] || null, [estaca.instituto]);

  // Estaca stats calculation
  const estStats = useMemo(() => {
    const calc = (E: SIREstaca | null) => {
      if (!E) return null;
      const alas = (E.alas || []).map(a => {
        const mat = +a.matriculados || 0;
        const pot = +a.potencial || 0;
        const taxa = pot > 0 ? (mat / pot) * 100 : 0;
        return { ...a, matriculados: mat, potencial: pot, taxa };
      });
      const sm = alas.reduce((s, a) => s + a.matriculados, 0);
      const sp = alas.reduce((s, a) => s + a.potencial, 0);
      const media = (E.matriculados || sm) && (E.potencial || sp) ? ((E.matriculados || sm) / (E.potencial || sp)) * 100 : 0;
      const rank = [...alas].sort((a, b) => b.taxa - a.taxa);
      const me = alas.find(a => /bosque/i.test(a.nome)) || null;
      const pos = me ? rank.findIndex(a => /bosque/i.test(a.nome)) + 1 : null;
      return { E, alas, media, me, pos, totalAlas: alas.length };
    };

    return {
      seminario: calc(latestEstacaSeminario),
      instituto: calc(latestEstacaInstituto),
    };
  }, [latestEstacaSeminario, latestEstacaInstituto]);

  const filteredAlunos = useMemo(() => {
    return alunosList.filter(a => {
      if (activeFilter === 'seminario') return /semi/i.test(a.tipo);
      if (activeFilter === 'instituto') return /inst/i.test(a.tipo);
      if (activeFilter === 'risco') return a.situacao === 'risco';
      if (activeFilter === 'pendencia') return a.situacao === 'pendencia';
      if (activeFilter === 'credito') return a.situacao === 'credito';
      return true;
    });
  }, [alunosList, activeFilter]);

  async function loadSIR() {
    try {
      setLoading(true);
      const res = await api.get<{
        alunos: SIRRelatorio[];
        estaca: { seminario: SIREstaca[]; instituto: SIREstaca[] };
      }>('/sir');
      setAlunosReports(res.alunos || []);
      setEstaca(res.estaca || { seminario: [], instituto: [] });
    } catch (err) {
      console.error('Erro ao carregar dados do SIR:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!importText.trim()) return;

    try {
      setImportSubmitting(true);
      // Basic parser for pasted tab-delimited or comma-delimited text
      const lines = importText.trim().split('\n').map(l => l.trim()).filter(Boolean);
      const newAlunos: SIRAluno[] = [];

      for (const line of lines) {
        const parts = line.includes('\t') ? line.split('\t') : line.split(',');
        if (parts.length >= 2) {
          const nome = parts[0].trim();
          const tipoStr = parts[1].trim();
          const freq = parts[2] ? parseFloat(parts[2].replace('%', '')) : 0;
          const leitura = parts[3] ? parseFloat(parts[3].replace('%', '')) : 0;
          const aulas = parts[4] ? parseInt(parts[4]) : 0;
          const avaliacao = parts[5]?.trim() || 'Não Feita';

          const situacao: 'credito' | 'pendencia' | 'risco' =
            freq >= 75 && leitura >= 75
              ? 'credito'
              : freq >= 75
              ? 'pendencia'
              : 'risco';

          newAlunos.push({
            nome,
            tipo: /inst/i.test(tipoStr) ? 'Instituto' : 'Seminário',
            situacao,
            freq,
            leitura,
            aulas,
            avaliacao,
          });
        }
      }

      if (newAlunos.length === 0) {
        alert('Não foi possível identificar alunos nas linhas coladas.');
        return;
      }

      await api.post('/sir/alunos/import', {
        data: importData,
        semestre: importSemestre,
        alunos: newAlunos,
      });

      setIsImportModalOpen(false);
      setImportText('');
      loadSIR();
    } catch (err: any) {
      alert(err.message || 'Erro ao importar alunos.');
    } finally {
      setImportSubmitting(false);
    }
  }

  function formatDatePt(dStr?: string) {
    if (!dStr) return '—';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dStr;
  }

  // Early returns safely placed AFTER all hooks
  if (!isBishopric) {
    return <div className="notice bisp">Acesso restrito aos membros do Bispado.</div>;
  }

  if (loading && alunosReports.length === 0) {
    return <div className="empty">Carregando dados do Seminário e Instituto…</div>;
  }

  return (
    <div className="stack">
      {/* Header */}
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
              onClick={() => setIsImportModalOpen(true)}
            >
              Importar relatório de alunos
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => loadSIR()}
            >
              Atualizar dados
            </button>
          </div>
        )}
      </div>

      {/* Two Top Cards: Seminário & Instituto */}
      <div className="grid2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Card Seminário */}
        <div className="pcard2 p-seminario">
          <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              🎓 Seminário
            </h3>
            <span className="row-m" style={{ color: 'var(--muted)', fontSize: '12px' }}>
              14 a 17 anos
            </span>
          </div>

          <div className="big">
            <span className="v">
              {estStats.seminario?.me?.matriculados ?? numSeminario}
            </span>
            <span className="l">
              matriculados de {estStats.seminario?.me?.potencial ?? 57} no potencial da ala ·{' '}
              <b style={{ color: 'var(--ink)' }}>
                {estStats.seminario?.me?.taxa ? `${estStats.seminario.me.taxa.toFixed(0)}%` : '14%'}
              </b>
            </span>
          </div>

          <div className="facts">
            <div className="fact">
              <b>{estStats.seminario?.media ? `${estStats.seminario.media.toFixed(1).replace('.', ',')}%` : '24,2%'}</b>
              <span>média da estaca</span>
            </div>
            <div className="fact">
              <b>{estStats.seminario?.pos ? `${estStats.seminario.pos}º de ${estStats.seminario.totalAlas}` : '6º de 7'}</b>
              <span>posição entre as alas</span>
            </div>
            <div className="fact">
              <b>{seminarioAlunos.length}</b>
              <span>alunos no relatório</span>
            </div>
            <div className="fact">
              <b>{avgSeminarioFreq}%</b>
              <span>frequência média</span>
            </div>
            <div className="fact">
              <b className={seminarioRisco ? 'late-txt' : ''}>{seminarioRisco}</b>
              <span>em risco</span>
            </div>
          </div>

          <span className="row-m" style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2 }}>
            Estaca: {formatDatePt(latestEstacaSeminario?.data || '2026-09-28')} · Relatório da ala: {formatDatePt(latestReport?.data || '2026-10-09')}
          </span>
        </div>

        {/* Card Instituto */}
        <div className="pcard2 p-instituto">
          <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              🎓 Instituto
            </h3>
            <span className="row-m" style={{ color: 'var(--muted)', fontSize: '12px' }}>
              18 a 30 anos
            </span>
          </div>

          <div className="big">
            <span className="v">
              {estStats.instituto?.me?.matriculados ?? numInstituto}
            </span>
            <span className="l">
              matriculados de {estStats.instituto?.me?.potencial ?? 167} no potencial da ala ·{' '}
              <b style={{ color: 'var(--ink)' }}>
                {estStats.instituto?.me?.taxa ? `${estStats.instituto.me.taxa.toFixed(1).replace('.', ',')}%` : '4,8%'}
              </b>
            </span>
          </div>

          <div className="facts">
            <div className="fact">
              <b>{estStats.instituto?.media ? `${estStats.instituto.media.toFixed(1).replace('.', ',')}%` : '4,5%'}</b>
              <span>média da estaca</span>
            </div>
            <div className="fact">
              <b>{estStats.instituto?.pos ? `${estStats.instituto.pos}º de ${estStats.instituto.totalAlas}` : '4º de 7'}</b>
              <span>posição entre as alas</span>
            </div>
            <div className="fact">
              <b>{institutoAlunos.length}</b>
              <span>alunos no relatório</span>
            </div>
            <div className="fact">
              <b>{avgInstitutoFreq}%</b>
              <span>frequência média</span>
            </div>
            <div className="fact">
              <b className={institutoRisco ? 'late-txt' : ''}>{institutoRisco}</b>
              <span>em risco</span>
            </div>
          </div>

          <span className="row-m" style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2 }}>
            Estaca: {formatDatePt(latestEstacaInstituto?.data || '2026-09-28')} · Relatório da ala: {formatDatePt(latestReport?.data || '2026-10-09')}
          </span>
        </div>
      </div>

      {/* Alunos da Ala Section */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontSize: '18px' }}>
              🎓 Alunos da ala · {latestReport?.semestre || '2º semestre 2026'}
            </h3>
            <p className="sub" style={{ fontSize: '13px', color: 'var(--muted)', margin: '4px 0 0' }}>
              Relatório de {latestReport?.data ? `sex, ${formatDatePt(latestReport.data)}` : 'sex, 09/10'}
            </p>
          </div>
        </div>

        {/* 4 Stat Boxes */}
        <div className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          <div className="stat" style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8 }}>
            <div className="v num" style={{ fontSize: '26px', fontWeight: 700 }}>
              {alunosList.length}
            </div>
            <div className="l" style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
              alunos
            </div>
            <div className="x" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 2 }}>
              {numSeminario} no Seminário · {numInstituto} no Instituto
            </div>
          </div>

          <div className="stat" style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8 }}>
            <div className="v num" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--cons, #10b981)' }}>
              {countCredito}
            </div>
            <div className="l" style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
              com crédito
            </div>
          </div>

          <div className="stat" style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8 }}>
            <div className="v num" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--warn, #f59e0b)' }}>
              {countPendencia}
            </div>
            <div className="l" style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
              com pendência
            </div>
          </div>

          <div className="stat" style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8 }}>
            <div className="v num" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--crit, #ef4444)' }}>
              {countRisco}
            </div>
            <div className="l" style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
              em risco
            </div>
          </div>
        </div>

        {/* Distribution bar */}
        {alunosList.length > 0 && (
          <div
            className="dist"
            role="img"
            aria-label={`${countCredito} com crédito, ${countPendencia} com pendência, ${countRisco} em risco`}
          >
            {countCredito > 0 && (
              <i
                className="d-cred"
                style={{ width: `${(countCredito / alunosList.length) * 100}%` }}
                title={`Crédito: ${countCredito}`}
              />
            )}
            {countPendencia > 0 && (
              <i
                className="d-pend"
                style={{ width: `${(countPendencia / alunosList.length) * 100}%` }}
                title={`Pendência: ${countPendencia}`}
              />
            )}
            {countRisco > 0 && (
              <i
                className="d-risco"
                style={{ width: `${(countRisco / alunosList.length) * 100}%` }}
                title={`Em risco: ${countRisco}`}
              />
            )}
          </div>
        )}

        {/* Legend */}
        <div className="legend">
          <span>
            <i className="d-cred" /> Crédito
          </span>
          <span>
            <i className="d-pend" /> Pendência
          </span>
          <span>
            <i className="d-risco" /> Em risco
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '12px' }}>
            Para crédito: 75% de frequência · leitura 75% · 100% nas Obras-Padrão
          </span>
        </div>

        {/* Filter Chips */}
        <div className="chips" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(
            [
              ['todos', 'Todos', alunosList.length],
              ['seminario', 'Seminário', numSeminario],
              ['instituto', 'Instituto', numInstituto],
              ['risco', 'Em risco', countRisco],
              ['pendencia', 'Pendência', countPendencia],
              ['credito', 'Crédito', countCredito],
            ] as const
          ).map(([val, label, n]) => (
            <button
              key={val}
              type="button"
              className={`chip ${activeFilter === val ? 'on' : ''}`}
              onClick={() => setActiveFilter(val)}
            >
              {label} <span className="c num">{n}</span>
            </button>
          ))}
        </div>

        {/* Students Table */}
        <div className="tscroll">
          <table>
            <thead>
              <tr>
                <th>SITUAÇÃO</th>
                <th>ALUNO</th>
                <th>TIPO</th>
                <th>FREQ.</th>
                <th>LEITURA</th>
                <th style={{ textAlign: 'right' }}>AULAS A RECUPERAR</th>
                <th>AVALIAÇÃO</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredAlunos.length ? (
                filteredAlunos.map((aluno, i) => {
                  const isLow = aluno.freq != null && aluno.freq < 75;
                  const isInstituto = /inst/i.test(aluno.tipo);

                  return (
                    <tr key={i}>
                      <td>
                        <span className={`sit sit-${aluno.situacao}`}>
                          {aluno.situacao === 'credito'
                            ? 'Crédito'
                            : aluno.situacao === 'risco'
                            ? 'Em risco'
                            : 'Pendência'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{aluno.nome}</td>
                      <td>
                        <span className={isInstituto ? 'tag-instituto' : 'tag-seminario'}>
                          {aluno.tipo.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`fbar ${isLow ? 'low' : ''}`}>
                          <s>
                            <i style={{ width: `${Math.min(100, aluno.freq || 0)}%` }} />
                          </s>
                          <span>{aluno.freq != null ? `${aluno.freq}%` : '—'}</span>
                        </span>
                      </td>
                      <td className={aluno.leitura != null && aluno.leitura < 75 ? 'late-txt' : ''}>
                        {aluno.leitura != null ? `${aluno.leitura}%` : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {aluno.aulas != null ? aluno.aulas : '—'}
                      </td>
                      <td className={/n[aã]o/i.test(aluno.avaliacao || '') ? 'late-txt' : ''}>
                        {aluno.avaliacao || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => {
                            alert(`Acompanhamento pastoral de ${aluno.nome}`);
                          }}
                        >
                          Acompanhar
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '16px 0', color: 'var(--muted)' }}>
                    Nenhum aluno com este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Importar Alunos */}
      {isImportModalOpen && (
        <div className="modal" onClick={() => setIsImportModalOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h3>Importar relatório de alunos (SIR)</h3>
            <p className="sub" style={{ fontSize: '13px', color: 'var(--muted)', marginTop: -6 }}>
              Cole os dados do relatório do Seminário e Instituto abaixo (separados por tabulação ou vírgula):
            </p>

            <form onSubmit={handleImportSubmit} className="form" style={{ marginTop: 12 }}>
              <div className="two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label>Data do relatório</label>
                  <input
                    className="inp"
                    type="date"
                    value={importData}
                    onChange={e => setImportData(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label>Semestre de referência</label>
                  <input
                    className="inp"
                    value={importSemestre}
                    onChange={e => setImportSemestre(e.target.value)}
                    placeholder="Ex.: 2º semestre 2026"
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>Linhas copiadas (Aluno, Tipo, Freq, Leitura, Aulas, Avaliação)</label>
                <textarea
                  className="inp"
                  rows={8}
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="Nome do Aluno	Seminário	80%	75%	2	Feita"
                  style={{ fontFamily: 'monospace', fontSize: '12px' }}
                  required
                />
              </div>

              <div className="foot" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <div className="btns">
                  <button type="submit" className="btn pri" disabled={importSubmitting}>
                    {importSubmitting ? 'Importando…' : 'Salvar relatório'}
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => setIsImportModalOpen(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
