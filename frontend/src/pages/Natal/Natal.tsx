import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { NatalEvento, NatalTarefa, NatalGasto } from '../../types';
import { NatalTab } from './natalConstants';
import { NatalHero } from './NatalHero';
import { NatalTabs } from './NatalTabs';
import { NatalTarefasTab } from './NatalTarefasTab';
import { NatalFinanceiroTab } from './NatalFinanceiroTab';
import { NatalIdeiasTab } from './NatalIdeiasTab';

export const Natal: React.FC = () => {
  const { isBishopric } = useAuth();
  const [evento, setEvento] = useState<NatalEvento>({
    data: '2025-12-20',
    horario: '19:00',
    local: 'Capela Ala Bosque',
    orcamentoTotal: 2500,
    tema: 'O Presente Supremo',
    foco: 'Convidar amigos e membros menos ativos para celebrar o nascimento de Jesus Cristo.',
  });
  const [tarefas, setTarefas] = useState<NatalTarefa[]>([]);
  const [gastos, setGastos] = useState<NatalGasto[]>([]);
  const [tab, setTab] = useState<NatalTab>('tarefas');
  const [loading, setLoading] = useState(true);

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

  const handleAdicionarTarefa = async (tarefa: { titulo: string; area: string; responsavel: string; prazo: string }) => {
    try {
      const res = await api.post<NatalTarefa>('/api/natal/tarefas', tarefa);
      setTarefas(prev => [...prev, res]);
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

  const handleAdicionarGasto = async (gasto: {
    descricao: string;
    categoria: string;
    valorEstimado: string;
    valorReal: string;
    comprovante: boolean;
    responsavel: string;
  }) => {
    try {
      const payload = {
        ...gasto,
        valorEstimado: parseFloat(gasto.valorEstimado) || 0,
        valorReal: gasto.valorReal ? parseFloat(gasto.valorReal) : undefined,
      };
      const res = await api.post<NatalGasto>('/api/natal/gastos', payload);
      setGastos(prev => [...prev, res]);
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
      <NatalHero
        evento={evento}
        diffDias={diffDias}
        tarefasConcluidas={tarefasConcluidas}
        totalTarefas={tarefas.length}
        percentualTarefas={percentualTarefas}
        totalReal={totalReal}
        saldoOrcamento={saldoOrcamento}
      />

      <NatalTabs
        currentTab={tab}
        onTabChange={setTab}
        tarefasCount={tarefas.length}
        gastosCount={gastos.length}
      />

      {tab === 'tarefas' && (
        <NatalTarefasTab
          tarefas={tarefas}
          onToggleTarefa={handleToggleTarefa}
          onExcluirTarefa={handleExcluirTarefa}
          onAdicionarTarefa={handleAdicionarTarefa}
        />
      )}

      {tab === 'financeiro' && (
        <NatalFinanceiroTab
          gastos={gastos}
          onExcluirGasto={handleExcluirGasto}
          onAdicionarGasto={handleAdicionarGasto}
        />
      )}

      {tab === 'ideias' && (
        <NatalIdeiasTab
          evento={evento}
          setEvento={setEvento}
          isBishopric={isBishopric}
          onSalvarEvento={handleSalvarEvento}
          onAplicarIdeias={handleAplicarIdeias}
        />
      )}
    </div>
  );
};
