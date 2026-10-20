import { Membro } from '../types';

const MONTH_MAP: Record<string, string> = {
  jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
  jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12'
};

export function parseDateBr(str: string): string {
  if (!str) return '';
  const m = str.trim().match(/^(\d{1,2})\s+([a-zA-Z]{3})\s+(\d{4})$/);
  if (m) {
    const day = m[1].padStart(2, '0');
    const mon = MONTH_MAP[m[2].toLowerCase()] || '01';
    const year = m[3];
    return `${year}-${mon}-${day}`;
  }
  return str.trim();
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone.trim();
}

/**
 * Parses LCR HTML export (e.g. Members.html) into an array of Membro records
 */
export function parseMembersHtml(html: string): Omit<Membro, 'id'>[] {
  const trRegex = /<tr[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g;
  let match;
  const list: Omit<Membro, 'id'>[] = [];

  while ((match = trRegex.exec(html)) !== null) {
    const rowHtml = match[2];

    const nameMatch = rowHtml.match(/<button[^>]*>([\s\S]*?)<\/button>/);
    const rawName = nameMatch ? nameMatch[1].trim() : '';
    if (!rawName) continue;

    let nomeNatural = rawName;
    if (rawName.includes(',')) {
      const parts = rawName.split(',');
      if (parts.length === 2) {
        nomeNatural = `${parts[1].trim()} ${parts[0].trim()}`;
      }
    }

    const sexoMatch = rowHtml.match(/cloned-column-header"[^>]*>Sexo<\/span>\s*([MF])/);
    const sexo = sexoMatch ? (sexoMatch[1] as 'M' | 'F') : '';

    const idadeMatch = rowHtml.match(/cloned-column-header"[^>]*>Idade<\/span>\s*(\d+)/);
    const idade = idadeMatch ? parseInt(idadeMatch[1], 10) : '';

    const nascMatch = rowHtml.match(/cloned-column-header"[^>]*>Data de Nascimento<\/span>\s*([^<]+)/);
    const rawNasc = nascMatch ? nascMatch[1].trim() : '';
    const nascimento = parseDateBr(rawNasc);

    let telefone = '';
    const telHrefMatch = rowHtml.match(/href="tel:([^"]*)"/);
    if (telHrefMatch && telHrefMatch[1]) {
      telefone = telHrefMatch[1].trim();
    } else {
      const telTextMatch = rowHtml.match(/cloned-column-header"[^>]*>Número de Telefone<\/span>\s*([^<]+)/);
      if (telTextMatch) telefone = telTextMatch[1].trim();
    }
    telefone = formatPhone(telefone);

    let email = '';
    const emailHrefMatch = rowHtml.match(/href="mailto:([^"]*)"/);
    if (emailHrefMatch && emailHrefMatch[1]) {
      email = emailHrefMatch[1].trim();
    } else {
      const emailTextMatch = rowHtml.match(/cloned-column-header"[^>]*>E-mail<\/span>\s*([^<]+)/);
      if (emailTextMatch) email = emailTextMatch[1].trim();
    }

    list.push({
      nome: nomeNatural,
      nomeOriginal: rawName,
      sexo,
      idade,
      nascimento,
      telefone,
      email,
      chamado: '',
    });
  }

  return list;
}
