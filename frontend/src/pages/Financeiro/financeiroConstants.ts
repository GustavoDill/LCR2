import { LinhaOrcamento } from '../../types';

export type StatusKey = 'exc' | 'bom' | 'norm' | 'crit';

export const FST: Record<StatusKey, [string, string]> = {
  exc: ['Excelente', 'até 50%'],
  bom: ['Bom', '51% a 80%'],
  norm: ['Normal', '81% a 100%'],
  crit: ['Crítico', 'acima de 100%'],
};

export const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

export const MES3L = MESES.map(m => m.slice(0, 1).toUpperCase() + m.slice(1, 3));

export const DEFAULT_ORGS: Omit<LinhaOrcamento, 'id'>[] = [
  { nome: 'Sociedade de Socorro', valor: 1500 },
  { nome: 'Quórum de Élderes', valor: 1500 },
  { nome: 'Rapazes', valor: 1600 },
  { nome: 'Moças', valor: 1600 },
  { nome: 'Primária', valor: 1400 },
  { nome: 'Jovens Adultos Solteiros', valor: 700 },
  { nome: 'Obra Missionária', valor: 400 },
  { nome: 'Seminário', valor: 500 },
  { nome: 'Festa de Natal da Ala', valor: 0 },
];
