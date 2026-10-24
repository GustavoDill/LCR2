import React from 'react';
import { EstacaStats, formatDatePt } from './seminarioUtils';

interface SeminarioCardsProps {
  estStats: {
    seminario: EstacaStats | null;
    instituto: EstacaStats | null;
  };
  numSeminario: number;
  numInstituto: number;
  seminarioAlunosCount: number;
  institutoAlunosCount: number;
  avgSeminarioFreq: number;
  avgInstitutoFreq: number;
  seminarioRisco: number;
  institutoRisco: number;
  latestEstacaSeminarioData?: string;
  latestEstacaInstitutoData?: string;
  latestReportData?: string;
}

export const SeminarioCards: React.FC<SeminarioCardsProps> = ({
  estStats,
  numSeminario,
  numInstituto,
  seminarioAlunosCount,
  institutoAlunosCount,
  avgSeminarioFreq,
  avgInstitutoFreq,
  seminarioRisco,
  institutoRisco,
  latestEstacaSeminarioData,
  latestEstacaInstitutoData,
  latestReportData,
}) => {
  return (
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
            <b>{seminarioAlunosCount}</b>
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
          Estaca: {formatDatePt(latestEstacaSeminarioData || '2026-09-28')} · Relatório da ala: {formatDatePt(latestReportData || '2026-10-09')}
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
            <b>{institutoAlunosCount}</b>
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
          Estaca: {formatDatePt(latestEstacaInstitutoData || '2026-09-28')} · Relatório da ala: {formatDatePt(latestReportData || '2026-10-09')}
        </span>
      </div>
    </div>
  );
};
