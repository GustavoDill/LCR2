import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { IndicadorMensal } from '../types';
import { IconCheck, IconChevronLeft, IconChevronRight, IconTrendingUp } from '../components/Icons';

export const Indicadores: React.FC = () => {
  const { isBishopric } = useAuth();
  const hoje = new Date();
  const mesAtualStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

  const [mesSelecionado, setMesSelecionado] = useState<string>(mesAtualStr);
  const [indicador, setIndicador] = useState<IndicadorMensal>({
    mes: mesAtualStr,
    sacramentalPresenca: 0,
    membrosAtivos: 0,
    recomendacoesValidas: 0,
    ministracaoCompanheirismos: 0,
    ministracaoEntrevistas: 0,
    jovensAtivos: 0,
    primariaPresenca: 0,
    observacoes: '',
  });
  const [historico, setHistorico] = useState<IndicadorMensal[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState(false);

  useEffect(() => {
    carregarHistorico();
  }, []);

  useEffect(() => {
    carregarMes(mesSelecionado);
  }, [mesSelecionado]);

  const carregarHistorico = async () => {
    try {
      const res = await api.get<IndicadorMensal[]>('/api/indicadores');
      setHistorico(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const carregarMes = async (mes: string) => {
    try {
      setLoading(true);
      const res = await api.get<IndicadorMensal>(`/api/indicadores/${mes}`);
      if (res && res.mes) {
        setIndicador(res);
      } else {
        setIndicador({
          mes,
          sacramentalPresenca: 0,
          membrosAtivos: 0,
          recomendacoesValidas: 0,
          ministracaoCompanheirismos: 0,
          ministracaoEntrevistas: 0,
          jovensAtivos: 0,
          primariaPresenca: 0,
          observacoes: '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvando(true);
      const res = await api.put<IndicadorMensal>(`/api/indicadores/${mesSelecionado}`, indicador);
      setIndicador(res);
      setMsgSucesso(true);
      setTimeout(() => setMsgSucesso(false), 3000);
      carregarHistorico();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar indicadores.');
    } finally {
      setSalvando(false);
    }
  };

  const navegarMes = (delta: number) => {
    const [ano, mes] = mesSelecionado.split('-').map(Number);
    const d = new Date(ano, mes - 1 + delta, 1);
    const novo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setMesSelecionado(novo);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', margin: 0 }}>Indicadores Chave da Ala</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)' }}>
            Acompanhamento de frequência sacramental, ordenanças, ministração e vitalidade espiritual
          </p>
        </div>

        {/* Date Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => navegarMes(-1)}>
            <IconChevronLeft size={16} />
          </button>
          <input
            type="month"
            className="input"
            value={mesSelecionado}
            onChange={e => setMesSelecionado(e.target.value)}
            style={{ fontWeight: 600, width: 170 }}
          />
          <button className="btn btn-secondary" onClick={() => navegarMes(1)}>
            <IconChevronRight size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 32 }}>Carregando dados do mês...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* Main Form */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>
                Mês de Referência: <span style={{ color: 'var(--color-primary)' }}>{mesSelecionado}</span>
              </h3>
              {msgSucesso && (
                <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IconCheck size={14} /> Salvo com sucesso!
                </span>
              )}
            </div>

            <form onSubmit={handleSalvar}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label className="label">Presença Média na Sacramental</label>
                  <input
                    type="number"
                    className="input"
                    value={indicador.sacramentalPresenca || ''}
                    onChange={e => setIndicador({ ...indicador, sacramentalPresenca: parseInt(e.target.value) || 0 })}
                    placeholder="Média de pessoas presentes aos domingos"
                    disabled={!isBishopric}
                  />
                  <small style={{ color: 'var(--color-text-muted)' }}>Contagem de frequência nas reuniões de domingo</small>
                </div>

                <div>
                  <label className="label">Membros Ativos Estimados</label>
                  <input
                    type="number"
                    className="input"
                    value={indicador.membrosAtivos || ''}
                    onChange={e => setIndicador({ ...indicador, membrosAtivos: parseInt(e.target.value) || 0 })}
                    placeholder="Total de membros que frequentam regularmente"
                    disabled={!isBishopric}
                  />
                  <small style={{ color: 'var(--color-text-muted)' }}>Base de apoio e participação geral</small>
                </div>

                <div>
                  <label className="label">Recomendações para o Templo Válidas</label>
                  <input
                    type="number"
                    className="input"
                    value={indicador.recomendacoesValidas || ''}
                    onChange={e => setIndicador({ ...indicador, recomendacoesValidas: parseInt(e.target.value) || 0 })}
                    placeholder="Adultos e jovens com recomendação"
                    disabled={!isBishopric}
                  />
                  <small style={{ color: 'var(--color-text-muted)' }}>Membros dignos de entrar na Casa do Senhor</small>
                </div>

                <div>
                  <label className="label">Presença Média na Primária</label>
                  <input
                    type="number"
                    className="input"
                    value={indicador.primariaPresenca || ''}
                    onChange={e => setIndicador({ ...indicador, primariaPresenca: parseInt(e.target.value) || 0 })}
                    placeholder="Crianças presentes aos domingos"
                    disabled={!isBishopric}
                  />
                  <small style={{ color: 'var(--color-text-muted)' }}>Crianças do berçário aos 11 anos</small>
                </div>

                <div>
                  <label className="label">Jovens Participando Ativamente</label>
                  <input
                    type="number"
                    className="input"
                    value={indicador.jovensAtivos || ''}
                    onChange={e => setIndicador({ ...indicador, jovensAtivos: parseInt(e.target.value) || 0 })}
                    placeholder="Rapazes e moças de 11 a 18 anos"
                    disabled={!isBishopric}
                  />
                  <small style={{ color: 'var(--color-text-muted)' }}>Presença em atividades e domingo</small>
                </div>

                <div>
                  <label className="label">Entrevistas de Ministração Realizadas</label>
                  <input
                    type="number"
                    className="input"
                    value={indicador.ministracaoEntrevistas || ''}
                    onChange={e => setIndicador({ ...indicador, ministracaoEntrevistas: parseInt(e.target.value) || 0 })}
                    placeholder="Total de entrevistas no trimestre"
                    disabled={!isBishopric}
                  />
                  <small style={{ color: 'var(--color-text-muted)' }}>Sociedade de Socorro e Quórum de Élderes</small>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="label">Anotações e Observações do Bispado</label>
                <textarea
                  className="textarea"
                  rows={4}
                  value={indicador.observacoes || ''}
                  onChange={e => setIndicador({ ...indicador, observacoes: e.target.value })}
                  placeholder="Focos espirituais, metas do conselho para este mês, conversões ou batismos recentes..."
                  disabled={!isBishopric}
                />
              </div>

              {isBishopric && (
                <button type="submit" className="btn btn-primary" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar Indicadores do Mês'}
                </button>
              )}
            </form>
          </div>

          {/* Sidebar: Historical Trend List */}
          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconTrendingUp size={18} color="var(--color-primary)" />
              Histórico Recente
            </h3>
            {historico.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                Nenhum mês anterior gravado.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {historico.slice(0, 8).map(h => (
                  <div
                    key={h.mes}
                    onClick={() => setMesSelecionado(h.mes)}
                    style={{
                      padding: 10,
                      borderRadius: 'var(--radius)',
                      border: h.mes === mesSelecionado ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: h.mes === mesSelecionado ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{h.mes}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Sacramental: {h.sacramentalPresenca || 0} • Rec: {h.recomendacoesValidas || 0}
                      </div>
                    </div>
                    <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                      Ver
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
