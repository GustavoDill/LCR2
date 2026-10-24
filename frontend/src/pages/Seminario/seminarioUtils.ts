import { SIREstaca, SIRAluno } from '../../types';

export interface EstacaStats {
  E: SIREstaca;
  alas: Array<{ nome: string; matriculados: number; potencial: number; taxa: number }>;
  media: number;
  me: { nome: string; matriculados: number; potencial: number; taxa: number } | null;
  pos: number | null;
  totalAlas: number;
}

export function formatDatePt(dStr?: string): string {
  if (!dStr) return '—';
  const parts = dStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dStr;
}

export function calcEstacaStats(E: SIREstaca | null): EstacaStats | null {
  if (!E) return null;
  const alas = (E.alas || []).map(a => {
    const mat = +a.matriculados || 0;
    const pot = +a.potencial || 0;
    const taxa = pot > 0 ? (mat / pot) * 100 : 0;
    return { ...a, matriculados: mat, potencial: pot, taxa };
  });
  const sm = alas.reduce((s, a) => s + a.matriculados, 0);
  const sp = alas.reduce((s, a) => s + a.potencial, 0);
  const media = (E.matriculados || sm) && (E.potencial || sp) ? ((E.matriculados || sm) / (E.potencial || sp)) * 100 : 0;
  const rank = [...alas].sort((a, b) => b.taxa - a.taxa);
  const me = alas.find(a => /bosque/i.test(a.nome)) || null;
  const pos = me ? rank.findIndex(a => /bosque/i.test(a.nome)) + 1 : null;
  return { E, alas, media, me, pos, totalAlas: alas.length };
}

export function parseImportLines(text: string): SIRAluno[] {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const newAlunos: SIRAluno[] = [];

  for (const line of lines) {
    const parts = line.includes('\t') ? line.split('\t') : line.split(',');
    if (parts.length >= 2) {
      const nome = parts[0].trim();
      const tipoStr = parts[1].trim();
      const freq = parts[2] ? parseFloat(parts[2].replace('%', '')) : 0;
      const leitura = parts[3] ? parseFloat(parts[3].replace('%', '')) : 0;
      const aulas = parts[4] ? parseInt(parts[4]) : 0;
      const avaliacao = parts[5]?.trim() || 'Não Feita';

      const situacao: 'credito' | 'pendencia' | 'risco' =
        freq >= 75 && leitura >= 75
          ? 'credito'
          : freq >= 75
          ? 'pendencia'
          : 'risco';

      newAlunos.push({
        nome,
        tipo: /inst/i.test(tipoStr) ? 'Instituto' : 'Seminário',
        situacao,
        freq,
        leitura,
        aulas,
        avaliacao,
      });
    }
  }

  return newAlunos;
}
