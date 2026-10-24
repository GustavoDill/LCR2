import { UserPermissions } from '../../types';

export const ORGANIZACOES_ALA = [
  'Sociedade de Socorro',
  'Quórum de Élderes',
  'Moças',
  'Rapazes (Sacerdócio Aarônico)',
  'Primária',
  'Escola Dominical',
  'Música da Ala',
  'Templo e História da Família',
  'Trabalho Missionário',
  'Outro / Geral',
];

export interface ModuloDesc {
  id: keyof UserPermissions;
  label: string;
  desc: string;
  icon: string;
  cor: string;
}

export const MODULOS_SISTEMA: ModuloDesc[] = [
  { id: 'inicio', label: 'Visão Geral', desc: 'Resumo geral, métricas da semana e atalhos rápidos', icon: 'grid', cor: '#60a5fa' },
  { id: 'reuniao', label: 'Reunião de Bispado/Conselho', desc: 'Pauta interativa e atas em tempo real', icon: 'board', cor: '#f472b6' },
  { id: 'designacoes', label: 'Designações & Tarefas', desc: 'Acompanhamento de tarefas, prazos e responsáveis', icon: 'checks', cor: '#22d3ee' },
  { id: 'chamados', label: 'Chamados & Desobrigações', desc: 'Propostas de chamados, estado das bênçãos e lista', icon: 'idcard', cor: '#38bdf8' },
  { id: 'pessoas', label: 'Famílias & Pessoas', desc: 'Anotações confidenciais, visitas e necessidades', icon: 'heart', cor: '#fb923c' },
  { id: 'membros', label: 'Diretório de Membros', desc: 'Lista de membros da Ala, dados e ordenanças', icon: 'users', cor: '#f87171' },
  { id: 'seminario', label: 'Seminário & Instituto', desc: 'Frequência e leitura dos jovens e JA', icon: 'cap', cor: '#a78bfa' },
  { id: 'financeiro', label: 'Financeiro & Orçamento', desc: 'Orçamentos das organizações e saldo anual', icon: 'wallet', cor: '#a3e635' },
  { id: 'agenda', label: 'Agenda & Eventos', desc: 'Calendário geral de eventos e reuniões da Ala', icon: 'cal', cor: '#facc15' },
  { id: 'atividades', label: 'Planejamento de Atividades', desc: 'Propostas, orçamentos e formulários de atividades', icon: 'flag', cor: '#fb7185' },
  { id: 'natal', label: 'Festa de Natal', desc: 'Planejamento e comitê do evento anual de Natal', icon: 'gift', cor: '#f87171' },
  { id: 'indicadores', label: 'Indicadores & Frequência', desc: 'Gráficos de sacramentais e frequência trimestral', icon: 'target', cor: '#4ade80' },
  { id: 'atas', label: 'Histórico de Atas', desc: 'Consulta e busca de atas de reuniões anteriores', icon: 'file', cor: '#2dd4bf' },
];
