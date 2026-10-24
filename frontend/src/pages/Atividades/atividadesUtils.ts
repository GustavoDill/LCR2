import { Atividade, AprovacaoAtividade, AtividadeStatus, FinanceiroTrimestre, LancamentoFinanceiro } from '../../types';
import { WEEKDAYS_SHORT } from './atividadesConstants';

export function parseDateParts(dateStr: string) {
  if (!dateStr) return null;
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(year, month, day);
    return { date: d, year, month, day, weekday: d.getDay() };
  }
  const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    const day = parseInt(brMatch[1], 10);
    const month = parseInt(brMatch[2], 10) - 1;
    const year = parseInt(brMatch[3], 10);
    const d = new Date(year, month, day);
    return { date: d, year, month, day, weekday: d.getDay() };
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return { date: d, year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), weekday: d.getDay() };
  }
  return null;
}

export function getDaysUntil(dateStr: string): number | null {
  const parts = parseDateParts(dateStr);
  if (!parts) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(parts.year, parts.month, parts.day);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDaysText(diff: number | null): string {
  if (diff === null) return '';
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff > 1) return `Faltam ${diff} dias`;
  if (diff === -1) return 'Ontem';
  return `Realizada há ${Math.abs(diff)} dias`;
}

export function formatSubtitleDate(dateStr: string, inicio?: string, fim?: string): string {
  const parts = parseDateParts(dateStr);
  const timeStr = inicio ? (fim ? `${inicio}–${fim}` : inicio) : '';
  if (!parts) return timeStr ? `· ${timeStr}` : '';
  const dayStr = String(parts.day).padStart(2, '0');
  const monthStr = String(parts.month + 1).padStart(2, '0');
  const weekdayStr = WEEKDAYS_SHORT[parts.weekday] || '';
  return `· ${weekdayStr}, ${dayStr}/${monthStr}${timeStr ? ` · ${timeStr}` : ''}`;
}

export function getStatus(a: Atividade, aprovacoes: Record<string, AprovacaoAtividade>): AtividadeStatus {
  const d = aprovacoes[a.id];
  if (!d) return 'aguardando';
  if (d.status === 'ajustes' && (a.atualizadoEm || 0) > d.decididoEm) return 'aguardando';
  return d.status || 'aguardando';
}

export function isUserSolicitante(
  a: Atividade,
  user: { uid?: string; email?: string | null; displayName?: string | null } | null
): boolean {
  if (!user) return false;
  if (a.solicitante?.uid && a.solicitante.uid === user.uid) return true;
  if (a.solicitante?.email && user.email && a.solicitante.email.toLowerCase() === user.email.toLowerCase()) return true;
  if (a.responsavel && user.displayName && a.responsavel.toLowerCase() === user.displayName.toLowerCase()) return true;
  return false;
}

export function getOrgSaldoString(
  orgName: string,
  orcamentos: Record<string, FinanceiroTrimestre>,
  lancamentos: LancamentoFinanceiro[]
): string {
  if (!orgName) return 'Não informado';
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const quarterKey = `${currentYear}-T${currentQuarter}`;
  const trimDesc = `${currentQuarter}° tri ${currentYear}`;

  const triData = orcamentos[quarterKey];
  if (triData && triData.linhas) {
    const normalizedTarget = orgName.toLowerCase().trim();
    const linha = triData.linhas.find(l => {
      const ln = l.nome.toLowerCase().trim();
      return ln === normalizedTarget || ln.includes(normalizedTarget) || normalizedTarget.includes(ln);
    });
    if (linha) {
      const lineId = linha.id;
      const lineExpenses = lancamentos
        .filter(l => l.periodo === quarterKey && (l.linha === lineId || l.linha === linha.nome))
        .reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
      const saldo = (Number(linha.valor) || 0) - lineExpenses;
      const formatted = saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${linha.nome}: R$ ${formatted} no ${trimDesc}`;
    }
  }

  return `${orgName}: R$ 600,00 no ${trimDesc}`;
}
