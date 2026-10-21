import fs from 'fs';
import path from 'path';
import { getDb } from '../config/firebase.js';
import { Membro, MembroMeta } from '../types/index.js';

const MONTH_MAP: Record<string, string> = {
  jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
  jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12'
};

function parseDateBr(str: string): string {
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

function formatPhone(phone: string): string {
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

export async function parseAndImportMembers(htmlFilePath?: string) {
  const filePath = htmlFilePath || path.resolve(process.cwd(), '../Members.html');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }

  const html = fs.readFileSync(filePath, 'utf8');
  const trRegex = /<tr[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g;
  let match;
  const members: Membro[] = [];

  while ((match = trRegex.exec(html)) !== null) {
    const rowId = match[1];
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
    const nascimentoIso = parseDateBr(rawNasc);

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

    members.push({
      id: rowId,
      nome: nomeNatural,
      nomeOriginal: rawName,
      sexo,
      idade,
      nascimento: nascimentoIso,
      telefone,
      email,
      chamado: '',
      atualizadoEm: Date.now(),
    });
  }

  members.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
  console.log(`[Parser] Extraídos com sucesso ${members.length} membros.`);

  const db = getDb();
  const CHUNK_SIZE = 250;
  const chunks: Membro[][] = [];

  for (let i = 0; i < members.length; i += CHUNK_SIZE) {
    chunks.push(members.slice(i, i + CHUNK_SIZE));
  }

  // Clear or overwrite chunks
  for (let i = 0; i < chunks.length; i++) {
    await db.doc(`conf/b/membros/lista-${i}`).set({ membros: chunks[i] });
    console.log(`[Firestore] Gravado conf/b/membros/lista-${i} com ${chunks[i].length} registros.`);
  }

  // Clean up higher chunk docs if any existed
  let extraIndex = chunks.length;
  while (true) {
    const extraDoc = await db.doc(`conf/b/membros/lista-${extraIndex}`).get();
    if (!extraDoc.exists) break;
    await db.doc(`conf/b/membros/lista-${extraIndex}`).delete();
    console.log(`[Firestore] Deletado chunk antigo órfão lista-${extraIndex}`);
    extraIndex++;
  }

  const meta: MembroMeta = {
    importadoEm: Date.now(),
    total: members.length,
    temChamado: false,
  };
  await db.doc('conf/b/membros/meta').set(meta);
  console.log(`[Firestore] Atualizado conf/b/membros/meta: total = ${members.length}`);

  return { total: members.length, chunks: chunks.length };
}

// Allow CLI execution
if (process.argv[1]?.includes('importMembers')) {
  parseAndImportMembers()
    .then(res => {
      console.log(`\nImportação concluída com sucesso! Total: ${res.total} membros.`);
      process.exit(0);
    })
    .catch(err => {
      console.error('Erro na importação:', err);
      process.exit(1);
    });
}
