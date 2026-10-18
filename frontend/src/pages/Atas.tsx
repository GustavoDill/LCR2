import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Ata } from '../types';
import { IconCalendar, IconCheck, IconSearch, IconChevronRight } from '../components/Icons';

export const Atas: React.FC = () => {
  const { isBishopric } = useAuth();
  const [atas, setAtas] = useState<Ata[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  const [ataSelecionada, setAtaSelecionada] = useState<Ata | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    carregarAtas();
  }, []);

  const carregarAtas = async () => {
    try {
      setLoading(true);
      const res = await api.get<Ata[]>('/api/reunioes/atas');
      setAtas(res || []);
      if (res && res.length > 0) {
        setAtaSelecionada(res[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const atasFiltradas = atas.filter(a => {
    if (tipoFiltro !== 'todos' && a.tipo !== tipoFiltro) return false;
    if (busca) {
      const b = busca.toLowerCase();
      const matchData = a.data?.includes(b);
      const matchTipo = a.tipo?.toLowerCase().includes(b);
      const matchNotas = Object.values(a.notas || {}).some(n => n?.toLowerCase().includes(b));
      if (!matchData && !matchTipo && !matchNotas) return false;
    }
    return true;
  });

  const handleCopiarResumo = () => {
    if (!ataSelecionada) return;
    const a = ataSelecionada;
    let txt = `*ATA DE REUNIÃO - ${a.tipo?.toUpperCase()}*\n`;
    txt += `Data: ${new Date(a.data).toLocaleDateString('pt-BR')}\n`;
    if (a.oracaoAbertura) txt += `Oração Inicial: ${a.oracaoAbertura}\n`;
    if (a.pensamentoEspiritual) txt += `Mensagem Espiritual: ${a.pensamentoEspiritual}\n`;
    txt += `\n*TÓPICOS TRATADOS:*\n`;

    if (a.notas && Object.keys(a.notas).length > 0) {
      Object.entries(a.notas).forEach(([secaoId, texto]) => {
        if (texto && texto.trim()) {
          txt += `\n• *${secaoId.toUpperCase()}*:\n${texto}\n`;
        }
      });
    } else {
      txt += `Sem anotações registradas.\n`;
    }

    if (a.oracaoEncerramento) txt += `\nOração Final: ${a.oracaoEncerramento}\n`;

    navigator.clipboard.writeText(txt);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', margin: 0 }}>Histórico de Atas de Reunião</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)' }}>
            Registro e arquivo das reuniões semanais do Bispado e Conselho da Ala
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <select
            className="input"
            value={tipoFiltro}
            onChange={e => setTipoFiltro(e.target.value)}
            style={{ width: 180 }}
          >
            <option value="todos">Todos os Tipos</option>
            <option value="conselho">Conselho da Ala</option>
            {isBishopric && <option value="bispado">Reunião do Bispado</option>}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 32 }}>Carregando atas gravadas...</div>
      ) : atas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-muted)' }}>
          Nenhuma ata finalizada encontrada. Quando você encerra uma reunião na aba &ldquo;Reunião&rdquo;, ela fica arquivada aqui.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>
          {/* List of Meetings */}
          <div className="card" style={{ padding: 12, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            <div style={{ marginBottom: 12, padding: '0 4px' }}>
              <input
                type="text"
                className="input"
                placeholder="Pesquisar em atas..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {atasFiltradas.map(a => {
                const isSelected = ataSelecionada?.id === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setAtaSelecionada(a)}
                    style={{
                      padding: 12,
                      borderRadius: 'var(--radius)',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: isSelected ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge ${a.tipo === 'bispado' ? 'badge-primary' : 'badge-info'}`}>
                        {a.tipo === 'bispado' ? 'Bispado' : 'Conselho da Ala'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {new Date(a.data).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', marginTop: 8, fontWeight: 500 }}>
                      {a.pensamentoEspiritual ? `Msg: "${a.pensamentoEspiritual.slice(0, 45)}..."` : 'Sem mensagem registrada'}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {Object.keys(a.notas || {}).length} tópicos anotados
                      </span>
                      <IconChevronRight size={14} color="var(--color-text-muted)" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Meeting Details */}
          {ataSelecionada ? (
            <div className="card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`badge ${ataSelecionada.tipo === 'bispado' ? 'badge-primary' : 'badge-info'}`}>
                      {ataSelecionada.tipo === 'bispado' ? 'Reunião do Bispado' : 'Conselho da Ala'}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                      Data: <strong>{new Date(ataSelecionada.data).toLocaleDateString('pt-BR')}</strong>
                    </span>
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', margin: '12px 0 0 0' }}>
                    Registro Oficial de Ata
                  </h2>
                </div>

                <button className="btn btn-secondary" onClick={handleCopiarResumo}>
                  {copiado ? (
                    <>
                      <IconCheck size={16} color="var(--color-success)" /> Copiado!
                    </>
                  ) : (
                    'Copiar para WhatsApp/Email'
                  )}
                </button>
              </div>

              {/* Prayers and thought */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24, padding: 14, background: 'var(--color-surface-hover)', borderRadius: 'var(--radius)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Oração Inicial
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>{ataSelecionada.oracaoAbertura || 'Não informado'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Mensagem Espiritual
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>{ataSelecionada.pensamentoEspiritual || 'Não informado'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Oração Final
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>{ataSelecionada.oracaoEncerramento || 'Não informado'}</div>
                </div>
              </div>

              {/* Sections Notes */}
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Anotações das Seções Pautadas</h3>
                {ataSelecionada.notas && Object.keys(ataSelecionada.notas).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {Object.entries(ataSelecionada.notas).map(([secaoId, texto]) => (
                      <div
                        key={secaoId}
                        style={{
                          padding: 14,
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius)',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary)', textTransform: 'capitalize', marginBottom: 6 }}>
                          {secaoId.replace(/-/g, ' ')}
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.5 }}>
                          {texto || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Sem anotações registradas.</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    Nenhum tópico com anotações registrado nesta reunião.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
              Selecione uma ata na lista ao lado para visualizar os detalhes.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
