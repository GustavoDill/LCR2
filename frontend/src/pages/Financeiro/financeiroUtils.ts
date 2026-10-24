import { MESES, StatusKey } from './financeiroConstants';

export function generateLineId(name: string) {
  const slug = (name || 'linha')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);
  return `${slug || 'linha'}-${Math.random().toString(36).slice(2, 6)}`;
}

export const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const money = (v: number) => BRL.format(v || 0);

export const kfmt = (v: number) =>
  Math.abs(v) >= 1000
    ? (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil'
    : Math.round(v).toLocaleString('pt-BR');

export const getStatus = (pct: number): StatusKey => {
  if (pct > 100) return 'crit';
  if (pct > 80) return 'norm';
  if (pct > 50) return 'bom';
  return 'exc';
};

export const formatDateBr = (dateStr: string) => {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

export function perMesesTxt(p: string) {
  const parts = (p || '').split('-T');
  const t = Number(parts[1]) || 1;
  const m = (t - 1) * 3;
  return `${MESES[m]}, ${MESES[m + 1]} e ${MESES[m + 2]}`;
}
