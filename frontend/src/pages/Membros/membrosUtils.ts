import { Membro } from '../../types';

export const norm = (s: any) =>
  String(s == null ? '' : s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export const ageOf = (m: Membro): number | null => {
  if (m.nascimento && /^\d{4}-\d{2}-\d{2}$/.test(m.nascimento)) {
    const [y, mm, d] = m.nascimento.split('-').map(Number);
    const b = new Date(y, mm - 1, d);
    const n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    return a;
  }
  const i = parseInt(String(m.idade || ''), 10);
  return isFinite(i) ? i : null;
};

export const ageGroup = (m: Membro): 'adultos' | 'jovens' | 'criancas' | '' => {
  const a = ageOf(m);
  if (a == null) return '';
  if (a < 12) return 'criancas';
  if (a < 18) return 'jovens';
  return 'adultos';
};
