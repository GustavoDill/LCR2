import { MuralAlmocoItem, MuralDiscursanteDom } from '../../types';
import { DIAS_DA_SEMANA_NOMES, MESES_NOMES } from './muralConstants';

/**
 * Calcula todos os domingos (4 ou 5) de um determinado mês e ano,
 * retornando no formato ["DIA 04/10", "DIA 11/10", ...]
 */
export function getSundaysOfMonth(year: number, monthIndex: number): string[] {
  const sundays: string[] = [];
  const d = new Date(year, monthIndex, 1);
  const mm = String(monthIndex + 1).padStart(2, '0');
  while (d.getMonth() === monthIndex) {
    if (d.getDay() === 0) {
      const dd = String(d.getDate()).padStart(2, '0');
      sundays.push(`DIA ${dd}/${mm}`);
    }
    d.setDate(d.getDate() + 1);
  }
  return sundays;
}

/**
 * Extrai ano e índice do mês (0-11) a partir de dataTopo ("DD/MM/YY" ou "DD/MM/YYYY")
 * ou do nome do mês ("Setembro", "Outubro", etc.), usando a data atual como fallback.
 */
export function resolveYearAndMonth(dataTopo?: string, mesNome?: string): { year: number; monthIndex: number } {
  const now = new Date();
  let year = now.getFullYear();
  let monthIndex = now.getMonth();

  if (dataTopo) {
    const parts = dataTopo.trim().split(/[/-]/);
    if (parts.length >= 2) {
      const parsedMonth = parseInt(parts[1], 10);
      if (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
        monthIndex = parsedMonth - 1;
      }
      if (parts[2]) {
        const rawYear = parseInt(parts[2], 10);
        if (!isNaN(rawYear)) {
          year = rawYear < 100 ? 2000 + rawYear : rawYear;
        }
      }
    }
  }

  if (mesNome) {
    const idx = MESES_NOMES.findIndex(m => m.toLowerCase() === mesNome.trim().toLowerCase());
    if (idx !== -1) {
      monthIndex = idx;
    }
  }

  return { year, monthIndex };
}

/**
 * Sincroniza a lista de discursantes para conter exatamente os domingos (4 ou 5) do mês/ano,
 * preservando os nomes já preenchidos (por data correspondente ou por posição).
 */
export function buildDiscursantesForMonth(
  year: number,
  monthIndex: number,
  existing: MuralDiscursanteDom[] = []
): MuralDiscursanteDom[] {
  const sundays = getSundaysOfMonth(year, monthIndex);
  return sundays.map((sundayLabel, idx) => {
    const byDate = existing.find(e => e.data === sundayLabel);
    if (byDate) {
      return { data: sundayLabel, nomes: byDate.nomes };
    }
    const byIndex = existing[idx];
    return {
      data: sundayLabel,
      nomes: byIndex ? byIndex.nomes : idx === 0 ? 'Testemunhos' : '',
    };
  });
}

/**
 * Retorna a data da segunda-feira da semana de uma data de referência (segunda a domingo).
 * Se a data for domingo (day 0), pertence à semana que começou na segunda-feira 6 dias antes.
 */
export function getMondayOfWeek(refDate: Date = new Date()): Date {
  const d = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const day = d.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Retorna a data do domingo correspondente ao encerramento da semana (segunda a domingo).
 */
export function getSundayOfWeek(refDate: Date = new Date()): Date {
  const monday = getMondayOfWeek(refDate);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return sunday;
}

/**
 * Tenta fazer o parse de uma string de data no formato DD/MM/AA ou DD/MM/YYYY.
 */
export function parseDateFromTopo(dataTopo?: string): Date | null {
  if (!dataTopo) return null;
  const parts = dataTopo.trim().split(/[/-]/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      if (year < 100) year = 2000 + year;
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const d = new Date(year, month - 1, day);
        if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
          return d;
        }
      }
    }
  }
  return null;
}

/**
 * Constrói a lista dos 7 dias da semana (Segunda a Domingo) para o Almoço das Sisteres.
 * Segunda-feira é sempre a primeira como 'P-Day'.
 * Preserva responsáveis já preenchidos caso correspondam ao dia da semana.
 */
export function buildCurrentWeekAlmoco(
  baseDate: Date = new Date(),
  existing: MuralAlmocoItem[] = []
): MuralAlmocoItem[] {
  const monday = getMondayOfWeek(baseDate);

  return DIAS_DA_SEMANA_NOMES.map((diaSemana, idx) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
    const dd = String(d.getDate()).padStart(2, '0');
    const diaLabel = `Dia ${dd}`;

    const match = existing.find(
      e => e.diaSemana?.trim().toLowerCase() === diaSemana.toLowerCase()
    );

    let responsavel = '';
    if (idx === 0) {
      responsavel = match?.responsavel && match.responsavel.trim() !== '' ? match.responsavel : 'P-Day';
    } else if (match) {
      responsavel = match.responsavel || '';
    }

    const isPday = idx === 0 || responsavel.toLowerCase().includes('pday') || responsavel.toLowerCase().includes('p-day');
    const destaque = match?.destaque !== undefined ? Boolean(match.destaque) : isPday;

    return {
      dia: diaLabel,
      diaSemana,
      responsavel,
      destaque,
    };
  });
}

/**
 * Normaliza os dados de Almoço das Sisteres garantindo que contenha os 7 dias (Segunda a Domingo)
 * com Segunda como primeiro dia e P-Day destacado com faixa por padrão.
 */
export function normalizeAlmocoSisteres(
  rawList: MuralAlmocoItem[] | undefined,
  refDate: Date = new Date()
): MuralAlmocoItem[] {
  if (!rawList || rawList.length === 0) {
    return buildCurrentWeekAlmoco(refDate);
  }

  const startsWithMonday = rawList[0]?.diaSemana?.trim().toLowerCase() === 'segunda';
  if (!startsWithMonday || rawList.length !== 7) {
    return buildCurrentWeekAlmoco(
      refDate,
      rawList.map(item => {
        const isPday =
          item.diaSemana?.toLowerCase() === 'segunda' ||
          item.responsavel?.toLowerCase().includes('pday') ||
          item.responsavel?.toLowerCase().includes('p-day');
        return isPday ? { ...item, destaque: true } : item;
      })
    );
  }

  return rawList.map((item, idx) => {
    if (idx === 0) {
      const responsavel = !item.responsavel || item.responsavel.trim() === '' ? 'P-Day' : item.responsavel;
      const isPday = responsavel.toLowerCase().includes('pday') || responsavel.toLowerCase().includes('p-day');
      return {
        ...item,
        responsavel,
        destaque: item.destaque !== undefined ? item.destaque : isPday,
      };
    }
    return item;
  });
}
