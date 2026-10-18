import React, { useEffect, useState } from 'react';
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
  const [activeFilter, setActiveFilter] = useState<'todos' | 'seminario' | 'instituto' | 'risco' | 'pendencia' | 'credito'>('todos');
  const [activeProg, setActiveProg] = useState<'seminario' | 'instituto'>('seminario');

  useEffect(() => {
    loadSIR();
  }, [isBishopric]);

  async function loadSIR() {
    try {
      const res = await api.get<{ alunos: SIRRelatorio[]; estaca: { seminario: SIREstaca[]; instituto: SIREstaca[] } }>('/sir');
      setAlunosReports(res.alunos || []);
      setEstaca(res.estaca || { seminario: [], instituto: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!isBishopric) {
    return <div className="notice bisp">Acesso restrito aos membros do Bispado.</div>;
  }

  if (loading) {
    return <div className="empty">Carregando dados do Seminário e Instituto…</div>;
  }

  const latestReport = alunosReports[0] || null;
  const alunosList: SIRAluno[] = latestReport?.alunos || [];

  const countBy = (sit: string) => alunosList.filter(a => a.situacao === sit).length;
  const numSeminario = alunosList.filter(a => /semi/i.test(a.tipo)).length;
  const numInstituto = alunosList.filter(a => /inst/i.test(a.tipo)).length;

  const filteredAlunos = alunosList.filter(a => {
    if (activeFilter === 'seminario') return /semi/i.test(a.tipo);
    if (activeFilter === 'instituto') return /inst/i.test(a.tipo);
    if (activeFilter === 'risco' || activeFilter === 'pendencia' || activeFilter === 'credito') {
      return a.situacao === activeFilter;
    }
    return true;
  });

  const latestEstaca = estaca[activeProg][0] || null;

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h2>Seminário e Instituto</h2>
          <p className="sub">
            Alunos da Ala Bosque e resultados da estaca. Somente o bispado vê esta página.
          </p>
        </div>
      </div>

      <div className="grid2">
        <div className="pcard2 p-seminario">
          <div className="head">
            <h3 style={{ margin: 0 }}>Seminário</h3>
            <span className="row-m">14 a 17 anos</span>
          </div>

          <div className="big">
            <span className="v">{numSeminario}</span>
            <span className="l">alunos da ala matriculados</span>
          </div>

          <div className="facts">
            <div className="fact">
              <b>{countBy('credito')}</b>
              <span>com crédito</span>
            </div>
            <div className="fact">
              <b>{countBy('pendencia')}</b>
              <span>com pendência</span>
            </div>
            <div className="fact">
              <b className={countBy('risco') ? 'late-txt' : ''}>{countBy('risco')}</b>
              <span>em risco</span>
            </div>
          </div>
        </div>

        <div className="pcard2 p-instituto">
          <div className="head">
            <h3 style={{ margin: 0 }}>Instituto</h3>
            <span className="row-m">18 a 30 anos</span>
          </div>

          <div className="big">
            <span className="v">{numInstituto}</span>
            <span className="l">alunos da ala matriculados</span>
          </div>

          <div className="facts">
            <div className="fact">
              <b>{latestEstaca?.matriculados || '—'}</b>
              <span>total na estaca</span>
            </div>
            <div className="fact">
              <b>{latestEstaca?.potencial || '—'}</b>
              <span>potencial</span>
            </div>
            <div className="fact">
              <b>{latestEstaca?.meta || '—'}</b>
              <span>meta</span>
            </div>
          </div>
        </div>
      </div>

      {latestReport && (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="head">
            <div>
              <h3 style={{ margin: 0 }}>Alunos da ala · {latestReport.semestre || 'Semestre atual'}</h3>
              <p className="sub" style={{ fontSize: 13 }}>
                Relatório de {latestReport.data}
              </p>
            </div>
          </div>

          <div className="chips">
            {(
              [
                ['todos', 'Todos', alunosList.length],
                ['seminario', 'Seminário', numSeminario],
                ['instituto', 'Instituto', numInstituto],
                ['risco', 'Em risco', countBy('risco')],
                ['pendencia', 'Pendência', countBy('pendencia')],
                ['credito', 'Crédito', countBy('credito')],
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

          <div className="tscroll">
            <table>
              <thead>
                <tr>
                  <th>Situação</th>
                  <th>Aluno</th>
                  <th>Tipo</th>
                  <th>Freq.</th>
                  <th>Leitura</th>
                  <th>Aulas a recuperar</th>
                  <th>Avaliação</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlunos.length ? (
                  filteredAlunos.map((aluno, i) => (
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
                        <span className={`tag ${/inst/i.test(aluno.tipo) ? 'tag-bispado' : 'tag-conselho'}`}>
                          {aluno.tipo}
                        </span>
                      </td>
                      <td>{aluno.freq != null ? `${aluno.freq}%` : '—'}</td>
                      <td>{aluno.leitura != null ? `${aluno.leitura}%` : '—'}</td>
                      <td>{aluno.aulas != null ? aluno.aulas : '—'}</td>
                      <td>{aluno.avaliacao || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center' }}>
                      Nenhum aluno com este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {latestEstaca && (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="head">
            <div>
              <h3 style={{ margin: 0 }}>Resultados da Estaca Passo Fundo Sul</h3>
              <p className="sub" style={{ fontSize: 13 }}>
                Atualizado em {latestEstaca.data}
              </p>
            </div>

            <div className="chips">
              <button
                type="button"
                className={`chip ${activeProg === 'seminario' ? 'on' : ''}`}
                onClick={() => setActiveProg('seminario')}
              >
                Seminário
              </button>
              <button
                type="button"
                className={`chip ${activeProg === 'instituto' ? 'on' : ''}`}
                onClick={() => setActiveProg('instituto')}
              >
                Instituto
              </button>
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="v num">{latestEstaca.potencial || '—'}</div>
              <div className="l">alunos em potencial</div>
            </div>
            <div className="stat">
              <div className="v num" style={{ color: 'var(--cons)' }}>
                {latestEstaca.matriculados}
              </div>
              <div className="l">matriculados</div>
            </div>
            <div className="stat">
              <div className="v num">{latestEstaca.anoAnterior || '—'}</div>
              <div className="l">ano anterior</div>
            </div>
            <div className="stat">
              <div className="v num">{latestEstaca.meta || '—'}</div>
              <div className="l">meta de crescimento</div>
            </div>
          </div>

          {latestEstaca.alas && latestEstaca.alas.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 15 }}>Matrículas por ala</h4>
              {latestEstaca.alas.map(a => {
                const taxa = a.potencial ? Math.round((a.matriculados / a.potencial) * 100) : 0;
                const isAlaBosque = /bosque/i.test(a.nome);

                return (
                  <div key={a.nome} className={`ala-row ${isAlaBosque ? 'me' : ''}`}>
                    <span style={{ fontWeight: isAlaBosque ? 700 : 500 }}>{a.nome}</span>
                    <span className="ala-track">
                      <i style={{ width: `${taxa}%` }} />
                    </span>
                    <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      <b>{taxa}%</b> · {a.matriculados} de {a.potencial}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
