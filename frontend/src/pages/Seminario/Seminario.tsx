import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { SIRRelatorio, SIREstaca, SIRAluno } from '../../types';
import { SeminarioFilter } from './seminarioConstants';
import { calcEstacaStats, formatDatePt } from './seminarioUtils';
import { SeminarioHeader } from './SeminarioHeader';
import { SeminarioCards } from './SeminarioCards';
import { SeminarioStatsBar } from './SeminarioStatsBar';
import { SeminarioTable } from './SeminarioTable';
import { SeminarioImportModal } from './SeminarioImportModal';

export const Seminario: React.FC = () => {
  const { isBishopric, canWrite } = useAuth();
  const [alunosReports, setAlunosReports] = useState<SIRRelatorio[]>([]);
  const [estaca, setEstaca] = useState<{ seminario: SIREstaca[]; instituto: SIREstaca[] }>({
    seminario: [],
    instituto: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<SeminarioFilter>('todos');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    loadSIR();
  }, [isBishopric]);

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

  const estStats = useMemo(() => {
    return {
      seminario: calcEstacaStats(latestEstacaSeminario),
      instituto: calcEstacaStats(latestEstacaInstituto),
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

  async function handleImport({
    data,
    semestre,
    alunos,
  }: {
    data: string;
    semestre: string;
    alunos: SIRAluno[];
  }) {
    await api.post('/sir/alunos/import', {
      data,
      semestre,
      alunos,
    });
    loadSIR();
  }

  if (!isBishopric) {
    return <div className="notice bisp">Acesso restrito aos membros do Bispado.</div>;
  }

  if (loading && alunosReports.length === 0) {
    return <div className="empty">Carregando dados do Seminário e Instituto…</div>;
  }

  const filterCounts: Record<SeminarioFilter, number> = {
    todos: alunosList.length,
    seminario: numSeminario,
    instituto: numInstituto,
    risco: countRisco,
    pendencia: countPendencia,
    credito: countCredito,
  };

  return (
    <div className="stack">
      <SeminarioHeader
        canWrite={canWrite}
        onOpenImport={() => setIsImportModalOpen(true)}
        onRefresh={loadSIR}
      />

      <SeminarioCards
        estStats={estStats}
        numSeminario={numSeminario}
        numInstituto={numInstituto}
        seminarioAlunosCount={seminarioAlunos.length}
        institutoAlunosCount={institutoAlunos.length}
        avgSeminarioFreq={avgSeminarioFreq}
        avgInstitutoFreq={avgInstitutoFreq}
        seminarioRisco={seminarioRisco}
        institutoRisco={institutoRisco}
        latestEstacaSeminarioData={latestEstacaSeminario?.data}
        latestEstacaInstitutoData={latestEstacaInstituto?.data}
        latestReportData={latestReport?.data}
      />

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

        <SeminarioStatsBar
          totalAlunos={alunosList.length}
          numSeminario={numSeminario}
          numInstituto={numInstituto}
          countCredito={countCredito}
          countPendencia={countPendencia}
          countRisco={countRisco}
        />

        <SeminarioTable
          filteredAlunos={filteredAlunos}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          counts={filterCounts}
        />
      </section>

      <SeminarioImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
};
