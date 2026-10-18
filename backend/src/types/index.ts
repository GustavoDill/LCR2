export type UserRole = 'bispado' | 'lider_org' | 'conselho';

export interface UserPermissions {
  inicio?: boolean;
  reuniao?: boolean;
  designacoes?: boolean;
  chamados?: boolean;
  pessoas?: boolean;
  membros?: boolean;
  seminario?: boolean;
  financeiro?: boolean;
  agenda?: boolean;
  atividades?: boolean;
  natal?: boolean;
  indicadores?: boolean;
  atas?: boolean;
  importar?: boolean;
  [key: string]: boolean | undefined;
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  name?: string;
  role: UserRole;
  isBishopric: boolean; // true for Bispado members
  canWrite: boolean;
  cargo?: string;
  organizacao?: string; // ex: 'Sociedade de Socorro', 'Quórum de Élderes', 'Moças', 'Primária', etc.
  permissoes?: UserPermissions;
  ativo?: boolean;
  criadoEm?: number;
  ultimoAcesso?: number;
}

export type OriginType = 'bispado' | 'conselho';
export type TaskStatus = 'pendente' | 'andamento' | 'concluida';

export interface Designacao {
  id: string;
  titulo: string;
  responsavel?: string;
  prazo?: string; // YYYY-MM-DD
  status: TaskStatus;
  proximo?: string;
  origem: OriginType;
  ataId?: string;
  criadoEm?: number;
  atualizadoEm?: number;
}

export type MeetingType = 'bispado' | 'conselho';
export type MeetingStatus = 'aberta' | 'encerrada';

export interface Ata {
  id: string;
  tipo: MeetingType;
  data: string; // YYYY-MM-DD
  status: MeetingStatus;
  inicioEm?: number;
  fimEm?: number;
  notas: Record<string, string>; // sectionKey => text, '_pres' for attendees
  tratados: Record<string, boolean>; // sectionKey => boolean
}

export type PessoaTipo = 'acomp' | 'ordenanca' | 'chamado' | 'missao' | 'temporal';

export interface Pessoa {
  id: string;
  nome: string;
  tipo: PessoaTipo;
  detalhe?: string;
  chamado?: string;
  proxima?: string;
  responsavel?: string;
  prazo?: string;
  obs?: string;
  status: 'aberto' | 'concluido';
  dpasso?: number; // for desobrigações (0, 1, 2)
  cargoRef?: {
    org: string;
    cargo: string;
  };
  criadoEm?: number;
  atualizadoEm?: number;
}

export interface CargoHistorico {
  pessoa: string;
  desde?: string;
  ate?: string;
}

export interface Cargo {
  id: string;
  titulo: string;
  pessoa?: string;
  desde?: string;
  fixo?: boolean;
  pendente?: {
    pessoa: string;
    pid?: string;
    data?: string;
  } | null;
  historico?: CargoHistorico[];
}

export interface Organizacao {
  id: string;
  nome: string;
  grupo: string;
  ordem?: number;
  cargos: Cargo[];
}

export interface Membro {
  id: string;
  nome: string;
  sexo?: 'M' | 'F' | '';
  nascimento?: string;
  idade?: number | '';
  telefone?: string;
  email?: string;
  endereco?: string;
  chamado?: string;
  obs?: string;
  atualizadoEm?: number;
}

export interface MembroMeta {
  importadoEm?: number;
  total?: number;
  temChamado?: boolean;
}

export type SIRSituacao = 'credito' | 'pendencia' | 'risco';

export interface SIRAluno {
  nome: string;
  tipo: string;
  situacao: SIRSituacao;
  aulas?: number | null;
  avaliacao?: string;
  leitura?: number | null;
  freq?: number | null;
}

export interface SIRRelatorio {
  id: string;
  data: string;
  semestre?: string;
  alunos: SIRAluno[];
  importadoEm?: number;
}

export interface SIREstacaAla {
  nome: string;
  matriculados: number;
  potencial: number;
}

export interface SIREstaca {
  id: string;
  programa: 'seminario' | 'instituto';
  data: string;
  potencial?: number;
  matriculados: number;
  anoAnterior?: number;
  meta?: number;
  alas: SIREstacaAla[];
  historico?: Record<string, number>;
  importadoEm?: number;
}

export interface LinhaOrcamento {
  id: string;
  nome: string;
  valor: number;
  orfa?: boolean;
}

export interface FinanceiroTrimestre {
  periodo: string; // e.g. "2026-T1"
  recebido: number;
  linhas: LinhaOrcamento[];
  atualizadoEm?: number;
}

export interface LancamentoFinanceiro {
  id: string;
  periodo: string;
  linha: string; // linha id
  valor: number;
  descricao: string;
  data: string;
  nota?: string;
  solicitante?: string;
  criadoEm?: number;
  atualizadoEm?: number;
}

export interface AgendaEvento {
  id: string;
  titulo: string;
  data: string;
  org: string;
  proposito?: string;
  responsavel?: string;
  obs?: string;
}

export type AtividadeStatus = 'aguardando' | 'aprovada' | 'ajustes' | 'recusada';

export interface Atividade {
  id: string;
  org: string;
  titulo: string;
  proposito: string;
  publico?: string;
  objetivo?: string;
  participantes?: string;
  data: string;
  inicio?: string;
  fim?: string;
  local: 'capela' | 'outro';
  localOutro?: string;
  capela: 'sim' | 'nao' | 'na';
  responsavel: string;
  telefone?: string;
  liderExtra?: 'sim' | 'nao';
  liderQuem?: string;
  custo: 'sim' | 'nao';
  valor?: number;
  orcamento?: string;
  itens?: string;
  menores?: boolean;
  permissao?: boolean;
  doisAdultos?: boolean;
  transporte?: boolean;
  alimentacao?: boolean;
  foraCidade?: boolean;
  obs?: string;
  fbSucesso?: string;
  fbMembros?: number | '';
  fbNaoMembros?: number | '';
  fbMelhorar?: string;
  fbEm?: number;
  criadoEm?: number;
  atualizadoEm?: number;
}

export interface AprovacaoAtividade {
  status: AtividadeStatus;
  comentario?: string;
  decididoEm: number;
  agendaId?: string | null;
}

export interface NatalEvento {
  id: string;
  nome?: string;
  data?: string;
  inicio?: string;
  local?: string;
  tema?: string;
  publico?: string;
  orcamento?: number;
  atualizadoEm?: number;
}

export interface NatalTarefa {
  id: string;
  titulo: string;
  area: string;
  status: TaskStatus;
  responsavel?: string;
  prazo?: string;
  antes?: number;
  obs?: string;
  criadoEm?: number;
  atualizadoEm?: number;
}

export interface NatalGasto {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  area?: string;
  responsavel?: string;
  nota?: string;
  finId?: string;
  criadoEm?: number;
  atualizadoEm?: number;
}

export interface IndicadorMensal {
  id: string;
  mes: string; // YYYY-MM
  sacramental?: number | null;
  jovens?: number | null;
  primaria?: number | null;
  ensinados?: number | null;
  retorno?: number | null;
  templo?: number | null;
  ministracao?: number | null;
  ordenancas?: number | null;
  ensino?: number | null;
  servico?: number | null;
  autossuf?: number | null;
  [key: string]: any;
}
