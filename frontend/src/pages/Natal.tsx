import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { NatalEvento, NatalTarefa, NatalGasto } from '../types';
import { IconCheck, IconTrash, IconCalendar, IconPlus, IconSparkles } from '../components/Icons';

export const Natal: React.FC = () => {
  const { isBishopric } = useAuth();
  const [evento, setEvento] = useState<NatalEvento>({
    data: '2025-12-20',
    horario: '19:00',
    local: 'Capela Ala Bosque',
    orcamentoTotal: 2500,
    tema: 'O Presente Supremo',
    foco: 'Convidar amigos e membros menos ativos para celebrar o nascimento de Jesus Cristo.'
  });
  const [tarefas, setTarefas] = useState<NatalTarefa[]>([]);
  const [gastos, setGastos] = useState<NatalGasto[]>([]);
  const [tab, setTab] = useState<'tarefas' | 'financeiro' | 'ideias'>('tarefas');
  const [loading, setLoading] = useState(true);

  // New task form
  const [novaTarefa, setNovaTarefa] = useState({
    titulo: '',
    area: 'geral',
    responsavel: '',
    prazo: '',
  });

  // New expense form
  const [novoGasto, setNovoGasto] = useState({
    descricao: '',
    categoria: 'decoracao',
    valorEstimado: '',
    valorReal: '',
    comprovante: false,
    responsavel: '',
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ evento: NatalEvento; tarefas: NatalTarefa[]; gastos: NatalGasto[] }>('/api/natal');
      if (res.evento) setEvento(res.evento);
      if (res.tarefas) setTarefas(res.tarefas);
      if (res.gastos) setGastos(res.gastos);
    } catch (err) {
      console.error('Erro ao carregar dados de natal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/api/natal/evento', evento);
      alert('Configurações da Festa de Natal salvas!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar evento.');
    }
  };

  const handleAdicionarTarefa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaTarefa.titulo) return;
    try {
      const res = await api.post<NatalTarefa>('/api/natal/tarefas', novaTarefa);
      setTarefas(prev => [...prev, res]);
      setNovaTarefa({ titulo: '', area: 'geral', responsavel: '', prazo: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTarefa = async (t: NatalTarefa) => {
    const novoStatus = t.status === 'concluida' ? 'pendente' : 'concluida';
    try {
      const res = await api.put<NatalTarefa>(`/api/natal/tarefas/${t.id}`, { status: novoStatus });
      setTarefas(prev => prev.map(item => (item.id === t.id ? res : item)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleExcluirTarefa = async (id: string) => {
    if (!confirm('Excluir esta tarefa?')) return;
    try {
      await api.delete(`/api/natal/tarefas/${id}`);
      setTarefas(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdicionarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoGasto.descricao || !novoGasto.valorEstimado) return;
    try {
      const payload = {
        ...novoGasto,
        valorEstimado: parseFloat(novoGasto.valorEstimado) || 0,
        valorReal: novoGasto.valorReal ? parseFloat(novoGasto.valorReal) : undefined,
      };
      const res = await api.post<NatalGasto>('/api/natal/gastos', payload);
      setGastos(prev => [...prev, res]);
      setNovoGasto({
        descricao: '',
        categoria: 'decoracao',
        valorEstimado: '',
        valorReal: '',
        comprovante: false,
        responsavel: '',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleExcluirGasto = async (id: string) => {
    if (!confirm('Excluir este gasto?')) return;
    try {
      await api.delete(`/api/natal/gastos/${id}`);
      setGastos(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAplicarIdeias = async () => {
    if (!confirm('Deseja carregar as tarefas e checklist sugeridos para a Festa de Natal?')) return;
    try {
      const res = await api.post<NatalTarefa[]>('/api/natal/tarefas/ideias', {});
      setTarefas(prev => [...prev, ...res]);
      setTab('tarefas');
    } catch (err) {
      console.error(err);
    }
  };

  // Calculations
  const totalEstimado = gastos.reduce((acc, g) => acc + (g.valorEstimado || 0), 0);
  const totalReal = gastos.reduce((acc, g) => acc + (g.valorReal || 0), 0);
  const saldoOrcamento = (evento.orcamentoTotal || 0) - (totalReal > 0 ? totalReal : totalEstimado);

  const tarefasConcluidas = tarefas.filter(t => t.status === 'concluida').length;
  const percentualTarefas = tarefas.length > 0 ? Math.round((tarefasConcluidas / tarefas.length) * 100) : 0;

  // Countdown
  const hoje = new Date();
  const dataFesta = new Date(evento.data + 'T' + (evento.horario || '19:00'));
  const diffDias = Math.ceil((dataFesta.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  if (loading) return <div className="card" style={{ padding: 32 }}>Carregando planejamento de Natal...</div>;

  return (
    <div>
      {/* Hero Natal */}
      <div className="xmas-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>✨</span>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem', opacity: 0.85, fontWeight: 700 }}>
                Comitê Especial Ala Bosque
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', margin: '0 0 8px 0' }}>
              Festa de Natal 2025
            </h1>
            <p style={{ margin: 0, opacity: 0.9, maxWidth: 600 }}>
              Tema: &ldquo;{evento.tema || 'O Presente Supremo'}&rdquo; • {evento.local || 'Capela'}
            </p>
          </div>

          <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '16px 24px', borderRadius: 'var(--radius)', minWidth: 160 }}>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
              {diffDias > 0 ? diffDias : 0}
            </div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9, marginTop: 4 }}>
              {diffDias === 1 ? 'Dia Restante' : 'Dias Restantes'}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.75, marginTop: 4 }}>
              {new Date(evento.data).toLocaleDateString('pt-BR')} às {evento.horario}
            </div>
          </div>
        </div>

        {/* Quick Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Tarefas Concluídas</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              {tarefasConcluidas} / {tarefas.length} ({percentualTarefas}%)
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Orçamento Teto</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              R$ {evento.orcamentoTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Gasto Realizado</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              R$ {totalReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Saldo Disponível</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: saldoOrcamento < 0 ? '#ffb4ab' : '#b7f397' }}>
              R$ {saldoOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, margin: '24px 0 16px 0', borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>
        <button
          className={`btn ${tab === 'tarefas' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('tarefas')}
        >
          Checklist de Tarefas ({tarefas.length})
        </button>
        <button
          className={`btn ${tab === 'financeiro' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('financeiro')}
        >
          Orçamento & Despesas ({gastos.length})
        </button>
        <button
          className={`btn ${tab === 'ideias' ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => setTab('ideias')}
        >
          <IconSparkles size={16} /> Ideias e Configurações
        </button>
      </div>

      {/* TAB: TAREFAS */}
      {tab === 'tarefas' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Plano de Ação</h3>
            {tarefas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)' }}>
                Nenhuma tarefa cadastrada. Adicione ao lado ou gere a partir do modelo de ideias!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tarefas.map(t => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: t.status === 'concluida' ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      opacity: t.status === 'concluida' ? 0.7 : 1,
                      textDecoration: t.status === 'concluida' ? 'line-through' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input
                        type="checkbox"
                        checked={t.status === 'concluida'}
                        onChange={() => handleToggleTarefa(t)}
                        style={{ cursor: 'pointer', width: 18, height: 18 }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{t.titulo}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', gap: 12, marginTop: 2 }}>
                          <span className="badge badge-info">{t.area}</span>
                          {t.responsavel && <span>Resp: <strong>{t.responsavel}</strong></span>}
                          {t.prazo && <span>Prazo: {new Date(t.prazo).toLocaleDateString('pt-BR')}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn-icon"
                      onClick={() => handleExcluirTarefa(t.id)}
                      title="Excluir tarefa"
                      style={{ color: 'var(--color-error)' }}
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Nova Tarefa */}
          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Nova Tarefa</h3>
            <form onSubmit={handleAdicionarTarefa} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label">Título da Tarefa</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: Definir cardápio e sobremesas"
                  value={novaTarefa.titulo}
                  onChange={e => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Área</label>
                <select
                  className="input"
                  value={novaTarefa.area}
                  onChange={e => setNovaTarefa({ ...novaTarefa, area: e.target.value })}
                >
                  <option value="geral">Geral / Coordenação</option>
                  <option value="decoracao">Decoração & Ambiente</option>
                  <option value="alimentacao">Alimentação & Buffet</option>
                  <option value="programa">Programa Espiritual & Músicas</option>
                  <option value="criancas">Atividades para Crianças</option>
                  <option value="limpeza">Montagem & Limpeza</option>
                </select>
              </div>

              <div>
                <label className="label">Responsável</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Nome do membro ou comitê"
                  value={novaTarefa.responsavel}
                  onChange={e => setNovaTarefa({ ...novaTarefa, responsavel: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Prazo Final</label>
                <input
                  type="date"
                  className="input"
                  value={novaTarefa.prazo}
                  onChange={e => setNovaTarefa({ ...novaTarefa, prazo: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
                <IconPlus size={16} /> Adicionar Tarefa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB: FINANCEIRO */}
      {tab === 'financeiro' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Itens de Custo e Compras</h3>
            {gastos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)' }}>
                Nenhum gasto orçado ou registrado para a festa.
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Resp.</th>
                    <th>Estimado</th>
                    <th>Real</th>
                    <th>Comp.?</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {gastos.map(g => (
                    <tr key={g.id}>
                      <td style={{ fontWeight: 600 }}>{g.descricao}</td>
                      <td>
                        <span className="badge badge-info">{g.categoria}</span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{g.responsavel || '-'}</td>
                      <td>R$ {g.valorEstimado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ fontWeight: 600, color: g.valorReal ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                        {g.valorReal ? `R$ ${g.valorReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td>{g.comprovante ? '✅' : '⏳'}</td>
                      <td>
                        <button
                          className="btn-icon"
                          onClick={() => handleExcluirGasto(g.id)}
                          style={{ color: 'var(--color-error)' }}
                        >
                          <IconTrash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Form Novo Gasto */}
          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Lançar Custo / Compra</h3>
            <form onSubmit={handleAdicionarGasto} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label">Item / Descrição</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: Luzes de Natal e fitas"
                  value={novoGasto.descricao}
                  onChange={e => setNovoGasto({ ...novoGasto, descricao: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Categoria</label>
                <select
                  className="input"
                  value={novoGasto.categoria}
                  onChange={e => setNovoGasto({ ...novoGasto, categoria: e.target.value })}
                >
                  <option value="decoracao">Decoração</option>
                  <option value="alimentacao">Alimentação</option>
                  <option value="lembrancinhas">Lembrancinhas</option>
                  <option value="equipamento">Equipamento / Som</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="label">Valor Estimado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="0,00"
                  value={novoGasto.valorEstimado}
                  onChange={e => setNovoGasto({ ...novoGasto, valorEstimado: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Valor Real / Pago (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="Opcional se ainda não foi pago"
                  value={novoGasto.valorReal}
                  onChange={e => setNovoGasto({ ...novoGasto, valorReal: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Quem fez a compra</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Nome do irmão(ã)"
                  value={novoGasto.responsavel}
                  onChange={e => setNovoGasto({ ...novoGasto, responsavel: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="chkComp"
                  checked={novoGasto.comprovante}
                  onChange={e => setNovoGasto({ ...novoGasto, comprovante: e.target.checked })}
                />
                <label htmlFor="chkComp" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                  Comprovante / Nota entregue ao Bispado
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
                <IconPlus size={16} /> Lançar Despesa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB: IDEIAS E CONFIGURAÇÃO */}
      {tab === 'ideias' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Configurações do Evento</h3>
            <form onSubmit={handleSalvarEvento} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label">Tema da Festa</label>
                <input
                  type="text"
                  className="input"
                  value={evento.tema}
                  onChange={e => setEvento({ ...evento, tema: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Data</label>
                  <input
                    type="date"
                    className="input"
                    value={evento.data}
                    onChange={e => setEvento({ ...evento, data: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Horário</label>
                  <input
                    type="time"
                    className="input"
                    value={evento.horario}
                    onChange={e => setEvento({ ...evento, horario: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Local</label>
                <input
                  type="text"
                  className="input"
                  value={evento.local}
                  onChange={e => setEvento({ ...evento, local: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Teto Orçamentário da Ala (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={evento.orcamentoTotal || ''}
                  onChange={e => setEvento({ ...evento, orcamentoTotal: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="label">Foco Missionário / Propósito</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={evento.foco || ''}
                  onChange={e => setEvento({ ...evento, foco: e.target.value })}
                />
              </div>

              {isBishopric && (
                <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
                  Salvar Configurações
                </button>
              )}
            </form>
          </div>

          <div className="card" style={{ background: 'var(--color-surface-hover)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconSparkles size={20} color="var(--color-primary)" />
              Sugestões e Templates Pré-definidos
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Precisa de inspiração para a organização? Você pode importar uma estrutura completa de checklist recomendada para festas de ala da Igreja.
            </p>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ padding: 12, background: 'var(--color-surface)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                <strong>Programa Espiritual Centrado no Salvador</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Apresentação das crianças da Primária cantando hinos natalinos, leitura dramatizada de Lucas 2 e vídeo oficial da Primeira Presidência.
                </p>
              </div>

              <div style={{ padding: 12, background: 'var(--color-surface)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                <strong>Jantar Compartilhado / Potluck Organizado</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  O Bispado providencia a carne principal (chester/pernil com orçamento da ala) e as famílias trazem saladas, arroz e sobremesas típicas.
                </p>
              </div>

              <div style={{ padding: 12, background: 'var(--color-surface)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                <strong>Árvore da Bondade (Serviço)</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Cartões com metas de serviço diário até o dia de Natal para os jovens e membros levarem para casa.
                </p>
              </div>
            </div>

            <button
              onClick={handleAplicarIdeias}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: 20 }}
            >
              <IconSparkles size={16} /> Importar Checklist Sugerido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
