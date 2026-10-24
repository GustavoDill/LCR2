export type UserRole = 'bispado' | 'lider_org' | 'conselho';

export type PermissionLevel = 'none' | 'read' | 'write';

export interface UserPermissions {
  inicio?: boolean | PermissionLevel;
  reuniao?: boolean | PermissionLevel;
  designacoes?: boolean | PermissionLevel;
  mural?: boolean | PermissionLevel;
  chamados?: boolean | PermissionLevel;
  pessoas?: boolean | PermissionLevel;
  membros?: boolean | PermissionLevel;
  seminario?: boolean | PermissionLevel;
  financeiro?: boolean | PermissionLevel;
  agenda?: boolean | PermissionLevel;
  atividades?: boolean | PermissionLevel;
  natal?: boolean | PermissionLevel;
  indicadores?: boolean | PermissionLevel;
  atas?: boolean | PermissionLevel;
  importar?: boolean | PermissionLevel;
  gerenciamento?: boolean | PermissionLevel;
  [key: string]: boolean | PermissionLevel | undefined;
}

export type AccessStatus = 'pendente' | 'aprovado' | 'recusado';

export interface UserAccessRequest {
  cargo?: string;
  organizacao?: string;
  justificativa?: string;
  solicitadoEm: number;
  status: AccessStatus;
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
  statusAcesso?: AccessStatus;
  solicitacaoAcesso?: UserAccessRequest;
  receberNotificacoesCadastro?: boolean;
  criadoEm?: number;
  ultimoAcesso?: number;
}

export type OriginType = 'bispado' | 'conselho';
export type TaskStatus = 'pendente' | 'andamento' | 'concluida';

export interface Designacao {
  id: string;
  titulo: string;
  responsavel?: string;
  prazo?: string;
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
  data: string;
  status: MeetingStatus;
  inicioEm?: number;
  fimEm?: number;
  oracaoAbertura?: string;
  pensamentoEspiritual?: string;
  oracaoEncerramento?: string;
  notas: Record<string, string>;
  tratados: Record<string, boolean>;
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
  dpasso?: number;
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
  pessoaRef?: { id: string; nome: string };
  desde?: string;
  fixo?: boolean;
  pendente?: {
    pessoa: string;
    pid?: string;
    data?: string;
    etapa?: string;
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

export type Suborganizacao = Organizacao;

export interface OrganizacaoItem {
  id: string;
  nome: string;
  ordem?: number;
}

export interface Membro {
  id: string;
  nome: string;
  nomeOriginal?: string;
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

export interface MembroProfile360 {
  membro: Membro;
  chamadosAtivos: {
    suborgId: string;
    suborgNome: string;
    orgGrupo: string;
    cargoId: string;
    cargoTitulo: string;
    desde?: string;
  }[];
  historicoChamados: {
    suborgId: string;
    suborgNome: string;
    orgGrupo: string;
    cargoTitulo: string;
    desde?: string;
    ate?: string;
  }[];
  processosPipeline: {
    id: string;
    tipo: string;
    detalhe: string;
    chamado: string;
    proxima: string;
    responsavel: string;
    prazo?: string;
    status: string;
    dpasso?: number;
    cargoRef?: { org: string; cargo: string };
    criadoEm?: number;
  }[];
  designacoes: {
    id: string;
    titulo: string;
    responsavel?: string;
    prazo?: string;
    status: 'pendente' | 'andamento' | 'concluida';
    origem: 'bispado' | 'conselho';
  }[];
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
  periodo: string;
  recebido: number;
  linhas: LinhaOrcamento[];
  atualizadoEm?: number;
}

export interface LancamentoFinanceiro {
  id: string;
  periodo: string;
  linha: string;
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

export interface SolicitanteInfo {
  uid: string;
  nome: string;
  email: string;
  cargo?: string;
  organizacao?: string;
}

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
  solicitante?: SolicitanteInfo;
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
  decididoPor?: {
    uid: string;
    nome: string;
    cargo?: string;
  };
  agendaId?: string | null;
}

export interface NatalEvento {
  id?: string;
  nome?: string;
  data: string;
  horario?: string;
  inicio?: string;
  local?: string;
  tema?: string;
  foco?: string;
  publico?: string;
  orcamento?: number;
  orcamentoTotal?: number;
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
  valor?: number;
  valorEstimado?: number;
  valorReal?: number;
  categoria?: string;
  comprovante?: boolean;
  data?: string;
  area?: string;
  responsavel?: string;
  nota?: string;
  finId?: string;
  criadoEm?: number;
  atualizadoEm?: number;
}

export interface IndicadorMensal {
  id?: string;
  mes: string;
  sacramentalPresenca?: number;
  membrosAtivos?: number;
  recomendacoesValidas?: number;
  ministracaoCompanheirismos?: number;
  ministracaoEntrevistas?: number;
  jovensAtivos?: number;
  primariaPresenca?: number;
  observacoes?: string;
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


export interface MuralAlmocoItem {
  dia: string;
  diaSemana: string;
  responsavel: string;
  destaque?: boolean;
}

export interface MuralDiscursanteDom {
  data: string;
  nomes: string;
}

export interface MuralLimpezaItem {
  responsavel: string;
  local: string;
}

export interface MuralEstudoSemana {
  periodo: string;
  escrituras: string;
  tema: string;
  imagemDataUrl?: string;
}

export interface MuralAnuncioItem {
  titulo: string;
  texto: string;
  link?: string;
}

export interface MuralData {
  dataTopo: string;
  alaTitulo: string;
  logoUrl?: string;
  institutoTexto: string;
  seminarioTexto: string;
  mesAlmoco: string;
  mostrarMesAlmoco?: boolean;
  almocoSisteres: MuralAlmocoItem[];
  discursantes: MuralDiscursanteDom[];
  modoLimpeza?: 'setores' | 'ala_unica';
  limpezaAlaUnica?: string;
  limpezaCapela: MuralLimpezaItem[];
  paoSacramento: string;
  estudoSemana: MuralEstudoSemana;
  anuncios: MuralAnuncioItem[];
  mostrarAnuncios?: boolean;
  atualizadoEm?: number;
}
