import { Cargo } from '../../types';

export const CH_FLOW = ['Indicado', 'Aprovação do bispado', 'Entrevista', 'Apoio na sacramental', 'Designação'];
export const D_FLOW = ['Conversar com a pessoa', 'Desobrigar na sacramental', 'Atualizar no LCR'];

export type ChamadosDesobrigacoesView = 'novos' | 'desob' | 'vagos' | 'feitos';
export type ModalTipo = 'chamado' | 'desob';

export interface VacantCargoItem {
  orgId: string;
  orgNome: string;
  orgGrupo: string;
  cargo: Cargo;
}

export interface OccupiedCargoItem {
  orgId: string;
  orgNome: string;
  cargo: Cargo;
}

export interface ChamadoFormData {
  nome: string;
  tipo: 'chamado';
  detalhe: string;
  chamado: string;
  proxima: string;
  responsavel: string;
  prazo: string;
  obs: string;
  cargoRef: { org: string; cargo: string } | null;
}
