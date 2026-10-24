import React, { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Membro, MuralAlmocoItem, MuralData, MuralDiscursanteDom } from '../types';
import logoBosqueSagrado from '../assets/logo-bosque-sagrado.png';

const COME_FOLLOW_ME_2026_URL =
  'https://beta.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-old-testament-2026?lang=por';

export const MESES_NOMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

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

export const DIAS_DA_SEMANA_NOMES = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
];

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
 * Segunda-feira é sempre a primeira como 'Pday'.
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

    // Busca se já existe um responsável preenchido para esse dia da semana
    const match = existing.find(
      e => e.diaSemana?.trim().toLowerCase() === diaSemana.toLowerCase()
    );

    let responsavel = '';
    if (idx === 0) {
      // Segunda-feira é sempre a primeira como P-Day
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

interface ComeFollowMeLessonPreset {
  id: string;
  start: string;
  end: string;
  periodo: string;
  escrituras: string;
  tema: string;
}

export const COME_FOLLOW_ME_2026_LESSONS: ComeFollowMeLessonPreset[] = [
  {
    id: '36',
    start: '2026-08-31',
    end: '2026-09-06',
    periodo: '31 de agosto a 6 de setembro',
    escrituras: 'Salmos 102–103; 110; 116–119; 127–128; 135–139; 146–150',
    tema: '“Louvai ao Senhor”',
  },
  {
    id: '37',
    start: '2026-09-07',
    end: '2026-09-13',
    periodo: '7 a 13 de setembro',
    escrituras: 'Provérbios 1–4; 15–16; 22; 31; Eclesiastes 1–3; 11–12',
    tema: '“Confia no Senhor de todo o teu coração”',
  },
  {
    id: '38',
    start: '2026-09-14',
    end: '2026-09-20',
    periodo: '14 a 20 de setembro',
    escrituras: 'Isaías 1–12',
    tema: '“Vinde, e andemos na luz do Senhor”',
  },
  {
    id: '39',
    start: '2026-09-21',
    end: '2026-09-27',
    periodo: '21 a 27 de setembro',
    escrituras: 'Isaías 13–14; 22; 24–30; 35',
    tema: '“Eis que este é o nosso Deus”',
  },
  {
    id: '40',
    start: '2026-09-28',
    end: '2026-10-04',
    periodo: '28 de setembro a 4 de outubro',
    escrituras: 'Isaías 40–49',
    tema: '“Consolai o meu povo”',
  },
  {
    id: '41',
    start: '2026-10-05',
    end: '2026-10-11',
    periodo: '5 a 11 de outubro',
    escrituras: 'Isaías 50–57',
    tema: '“Ele foi ferido pelas nossas transgressões”',
  },
  {
    id: '42',
    start: '2026-10-12',
    end: '2026-10-18',
    periodo: '12 a 18 de outubro',
    escrituras: 'Isaías 58–66',
    tema: '“O Redentor virá a Sião”',
  },
  {
    id: '43',
    start: '2026-10-19',
    end: '2026-10-25',
    periodo: '19 a 25 de outubro',
    escrituras: 'Jeremias 1–3; 7; 16–18; 20',
    tema: '“Antes que te formasse no ventre, te conheci”',
  },
  {
    id: '44',
    start: '2026-10-26',
    end: '2026-11-01',
    periodo: '26 de outubro a 1 de novembro',
    escrituras: 'Jeremias 30–33; 36; Lamentações 1; 3',
    tema: '“Farei uma aliança nova com a casa de Israel”',
  },
  {
    id: '45',
    start: '2026-11-02',
    end: '2026-11-08',
    periodo: '2 a 8 de novembro',
    escrituras: 'Ezequiel 1–3; 33–34; 36–37; 47',
    tema: '“Dar-vos-ei um coração novo”',
  },
  {
    id: '46',
    start: '2026-11-09',
    end: '2026-11-15',
    periodo: '9 a 15 de novembro',
    escrituras: 'Daniel 1–7',
    tema: '“Não há outro Deus que possa livrar como este”',
  },
  {
    id: '47',
    start: '2026-11-16',
    end: '2026-11-22',
    periodo: '16 a 22 de novembro',
    escrituras: 'Oseias 1–6; 10–14; Joel',
    tema: '“Conheçamos e prossigamos em conhecer ao Senhor”',
  },
  {
    id: '48',
    start: '2026-11-23',
    end: '2026-11-29',
    periodo: '23 a 29 de novembro',
    escrituras: 'Amós; Obadias; Jonas',
    tema: '“Buscai ao Senhor, e vivei”',
  },
  {
    id: '49',
    start: '2026-11-30',
    end: '2026-12-06',
    periodo: '30 de novembro a 6 de dezembro',
    escrituras: 'Miqueias; Naum; Habacuque; Sofonias',
    tema: '“Andar humildemente com o teu Deus”',
  },
  {
    id: '50',
    start: '2026-12-07',
    end: '2026-12-13',
    periodo: '7 a 13 de dezembro',
    escrituras: 'Ageu 1–2; Zacarias 1–4; 7–14',
    tema: '“Santidade ao Senhor”',
  },
  {
    id: '51',
    start: '2026-12-14',
    end: '2026-12-20',
    periodo: '14 a 20 de dezembro',
    escrituras: 'Malaquias',
    tema: '“Tornai-vos para mim, e eu me tornarei para vós”',
  },
  {
    id: '52',
    start: '2026-12-21',
    end: '2026-12-27',
    periodo: '21 a 27 de dezembro',
    escrituras: 'Natal',
    tema: '“Um menino nos nasceu”',
  },
];

function getCurrentWeekLesson(): ComeFollowMeLessonPreset {
  const todayIso = new Date().toISOString().split('T')[0];
  const match = COME_FOLLOW_ME_2026_LESSONS.find(l => todayIso >= l.start && todayIso <= l.end);
  return match || COME_FOLLOW_ME_2026_LESSONS.find(l => l.id === '43') || COME_FOLLOW_ME_2026_LESSONS[4];
}

function getInitialMuralState(): MuralData {
  return {
    dataTopo: '06/09/26',
    alaTitulo: 'BOSQUE SAGRADO',
    logoUrl: '',
    institutoTexto: 'Sábados as 18h\nna Capela Bosque\nSexta as às 18h na capela\ndo Centro',
    seminarioTexto: 'Terças e quintas às 18h',
    mesAlmoco: 'Setembro',
    mostrarMesAlmoco: false,
    almocoSisteres: [
      { dia: 'Dia 07', diaSemana: 'Segunda', responsavel: 'P-Day', destaque: true },
      { dia: 'Dia 08', diaSemana: 'Terça', responsavel: 'Francelys', destaque: false },
      { dia: 'Dia 09', diaSemana: 'Quarta', responsavel: 'Lúcia', destaque: false },
      { dia: 'Dia 10', diaSemana: 'Quinta', responsavel: 'Suzana', destaque: false },
      { dia: 'Dia 11', diaSemana: 'Sexta', responsavel: 'Ruth', destaque: false },
      { dia: 'Dia 12', diaSemana: 'Sábado', responsavel: 'Soeli', destaque: false },
      { dia: 'Dia 13', diaSemana: 'Domingo', responsavel: 'Rosane Flores', destaque: false },
    ],
    discursantes: [
      { data: 'DIA 06/09', nomes: 'Testemunhos' },
      { data: 'DIA 13/09', nomes: 'Rebeca\nSister\nBruno Almeida' },
      { data: 'DIA 20/09', nomes: 'Conferência da Ala' },
      { data: 'DIA 27/09', nomes: 'Camila Bueno\nLeonardo Godinho\n--------------------' },
    ],
    modoLimpeza: 'ala_unica',
    limpezaAlaUnica: 'Ala Planaltina',
    limpezaCapela: [
      { responsavel: 'Mariano', local: 'Salão Cultural' },
      { responsavel: '--------', local: 'Salas' },
      { responsavel: 'Adilson Rodrigues', local: 'Sacramental' },
      { responsavel: 'Everton Suertegaray', local: 'Corredores de baixo' },
      { responsavel: 'Rogerio lucio', local: 'Banheiros de baixo' },
      { responsavel: 'Alexandro Carvalho', local: 'Banheiros de cima' },
      { responsavel: 'Familia Adames', local: 'Cozinha, corredores e escadas' },
    ],
    paoSacramento: 'Irmã Soeli',
    estudoSemana: {
      periodo: '7 a 13 de setembro',
      escrituras: 'Provérbios 1–4; 15–16; 22; 31; Eclesiastes 1–3; 11–12.',
      tema: '“Ele endireitará as tuas veredas”',
      imagemDataUrl: '',
    },
    anuncios: [
      {
        titulo: 'Serão Abre malas FSY 2027 dia 27 as 17h30',
        texto:
          'No dia 27/09, às 17h30, teremos nosso Serão Abre Malas das Estacas Passo Fundo e Passo Fundo Sul, um momento especial para jovens de 14 a 18 anos, pais e líderes conhecerem mais sobre o FSY 2027 e se prepararem para essa experiência inesquecível.',
      },
      {
        titulo: 'Curso Educação Para um Emprego Melhor\nTodas as Quartas as 19:30',
        texto: 'Inscrições Abertas!!\ninicio Dia 30 as 19h\nlink para inscrição abaixo:',
        link: 'https://quickreg.churchofjesuschrist.org',
      },
    ],
    mostrarAnuncios: false,
  };
}

type SectionTab = 'almoco' | 'discursantes' | 'limpeza' | 'estudo' | 'extras';

export const Mural: React.FC = () => {
  const { canWrite, user } = useAuth();
  const [mural, setMural] = useState<MuralData>(getInitialMuralState);
  const [members, setMembers] = useState<Membro[]>([]);
  const [activeTab, setActiveTab] = useState<SectionTab>('almoco');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [sidebarZoom, setSidebarZoom] = useState(0.7);
  const [modalZoom, setModalZoom] = useState(1.0);
  const [posterHeight, setPosterHeight] = useState(760);
  const posterRef = useRef<HTMLDivElement>(null);
  const modalPosterRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (posterRef.current) {
      setPosterHeight(posterRef.current.scrollHeight || 760);
    }
  }, [mural, sidebarZoom]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isZoomModalOpen) {
        setIsZoomModalOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomModalOpen]);

  function normalizeMuralData(raw: MuralData): MuralData {
    const { year, monthIndex } = resolveYearAndMonth(raw.dataTopo, raw.mesAlmoco);
    const refDate = parseDateFromTopo(raw.dataTopo) || new Date();
    return {
      ...raw,
      mesAlmoco: MESES_NOMES[monthIndex] || raw.mesAlmoco,
      discursantes: buildDiscursantesForMonth(year, monthIndex, raw.discursantes || []),
      almocoSisteres: normalizeAlmocoSisteres(raw.almocoSisteres, refDate),
      modoLimpeza: raw.modoLimpeza || (raw.limpezaAlaUnica ? 'ala_unica' : 'setores'),
      limpezaAlaUnica: raw.limpezaAlaUnica || 'Ala Planaltina',
      mostrarMesAlmoco: raw.mostrarMesAlmoco !== undefined ? raw.mostrarMesAlmoco : false,
      mostrarAnuncios: raw.mostrarAnuncios !== undefined ? raw.mostrarAnuncios : false,
    };
  }

  async function loadInitialData(isManualReload = false) {
    try {
      const [muralRes, membersRes] = await Promise.all([
        api.get<MuralData>('/mural').catch(err => {
          console.warn('Não foi possível obter mural do servidor:', err);
          return null;
        }),
        api.get<{ members: Membro[] }>('/membros').catch(() => ({ members: [] })),
      ]);
      if (muralRes && muralRes.almocoSisteres) {
        const normalized = normalizeMuralData(muralRes);
        setMural(normalized);
        try {
          localStorage.setItem('lcr2_mural_draft', JSON.stringify(normalized));
        } catch {
          // ignore storage quota error
        }
        if (isManualReload) {
          setStatusMsg('Mural recarregado do Firebase com sucesso!');
          setTimeout(() => setStatusMsg(''), 3500);
        }
      } else {
        const savedLocal = localStorage.getItem('lcr2_mural_draft');
        if (savedLocal) {
          try {
            setMural(normalizeMuralData(JSON.parse(savedLocal)));
          } catch {
            // keep default
          }
        }
      }
      setMembers(membersRes?.members || []);
    } catch (err) {
      console.error('Erro ao carregar dados do mural:', err);
    }
  }

  function updateMural(updater: (prev: MuralData) => MuralData) {
    setMural(prev => {
      const next = updater(prev);
      try {
        localStorage.setItem('lcr2_mural_draft', JSON.stringify(next));
      } catch {
        // ignore quota errors if image is large
      }
      return next;
    });
  }

  function handleDataTopoChange(newDataTopo: string) {
    updateMural(prev => {
      const { year, monthIndex } = resolveYearAndMonth(newDataTopo, undefined);
      const parsedParts = newDataTopo.trim().split(/[/-]/);
      const hasValidMonth =
        parsedParts.length >= 2 &&
        !isNaN(parseInt(parsedParts[1], 10)) &&
        parseInt(parsedParts[1], 10) >= 1 &&
        parseInt(parsedParts[1], 10) <= 12;

      if (!hasValidMonth) {
        return { ...prev, dataTopo: newDataTopo };
      }

      const topoDate = parseDateFromTopo(newDataTopo);
      const updatedAlmoco = topoDate
        ? buildCurrentWeekAlmoco(topoDate, prev.almocoSisteres)
        : prev.almocoSisteres;

      return {
        ...prev,
        dataTopo: newDataTopo,
        mesAlmoco: MESES_NOMES[monthIndex],
        discursantes: buildDiscursantesForMonth(year, monthIndex, prev.discursantes),
        almocoSisteres: updatedAlmoco,
      };
    });
  }

  function handleFillCurrentWeekAlmoco() {
    const today = new Date();
    const sunday = getSundayOfWeek(today);
    const sundayDd = String(sunday.getDate()).padStart(2, '0');
    const sundayMm = String(sunday.getMonth() + 1).padStart(2, '0');
    const yy = String(sunday.getFullYear()).slice(-2);
    const newSundayTopo = `${sundayDd}/${sundayMm}/${yy}`;
    const newMes = MESES_NOMES[sunday.getMonth()];

    updateMural(prev => {
      const { year, monthIndex } = resolveYearAndMonth(newSundayTopo, newMes);
      // Garante que Segunda (P-Day) tenha destaque (faixa) ativo por padrão
      const baseExisting = prev.almocoSisteres.map((item, idx) => {
        if (idx === 0) return { ...item, destaque: true };
        return item;
      });
      return {
        ...prev,
        dataTopo: newSundayTopo,
        mesAlmoco: newMes,
        almocoSisteres: buildCurrentWeekAlmoco(today, baseExisting),
        discursantes: buildDiscursantesForMonth(year, monthIndex, prev.discursantes),
      };
    });
    setStatusMsg('Almoço das Sisteres preenchido para a semana atual (P-Day com faixa)!');
    setTimeout(() => setStatusMsg(''), 3500);
  }

  function handleMonthChange(newMesNome: string) {
    updateMural(prev => {
      const { year, monthIndex } = resolveYearAndMonth(prev.dataTopo, newMesNome);
      const updatedDiscursantes = buildDiscursantesForMonth(year, monthIndex, prev.discursantes);
      // Atualiza também o mês na dataTopo se estiver no formato DD/MM/YY
      const parts = prev.dataTopo.trim().split('/');
      let nextDataTopo = prev.dataTopo;
      if (parts.length >= 2) {
        parts[1] = String(monthIndex + 1).padStart(2, '0');
        nextDataTopo = parts.join('/');
      }
      return {
        ...prev,
        mesAlmoco: newMesNome,
        dataTopo: nextDataTopo,
        discursantes: updatedDiscursantes,
      };
    });
  }

  async function handleSaveServer() {
    if (user && canWrite === false) {
      alert('Seu perfil de usuário não tem permissão para salvar alterações no mural.');
      return;
    }
    setSaving(true);
    setStatusMsg('');
    try {
      const saved = await api.put<MuralData>('/mural', mural);
      if (saved) {
        const normalized = normalizeMuralData(saved);
        setMural(normalized);
        try {
          localStorage.setItem('lcr2_mural_draft', JSON.stringify(normalized));
        } catch {
          // ignore quota
        }
      }
      setStatusMsg('Mural salvo com sucesso no Firebase!');
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err: any) {
      console.error('Erro ao salvar mural no Firebase:', err);
      alert(err.message || 'Erro ao salvar mural no Firebase.');
    } finally {
      setSaving(false);
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      updateMural(prev => ({
        ...prev,
        estudoSemana: {
          ...prev.estudoSemana,
          imagemDataUrl: result,
        },
      }));
    };
    reader.readAsDataURL(file);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      updateMural(prev => ({
        ...prev,
        logoUrl: result,
      }));
    };
    reader.readAsDataURL(file);
  }

  function handleSelectCurrentWeekStudy() {
    const cur = getCurrentWeekLesson();
    updateMural(prev => ({
      ...prev,
      estudoSemana: {
        ...prev.estudoSemana,
        periodo: cur.periodo,
        escrituras: cur.escrituras,
        tema: cur.tema,
      },
    }));
    setStatusMsg(`Estudo atualizado para a semana atual (${cur.periodo})!`);
    setTimeout(() => setStatusMsg(''), 3500);
  }

  async function handleDownloadPng() {
    const targetEl = posterRef.current || modalPosterRef.current;
    if (!targetEl) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(targetEl, {
        cacheBust: true,
        pixelRatio: 2,
        width: 540,
        height: targetEl.scrollHeight || 760,
        style: {
          transform: 'none',
          transformOrigin: 'top left',
        },
      });
      const link = document.createElement('a');
      const safeDate = (mural.dataTopo || 'mural').replace(/[^0-9a-zA-Z_-]/g, '-');
      link.download = `mural-ala-bosque-${safeDate}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erro ao gerar imagem PNG:', err);
      alert('Não foi possível exportar a imagem PNG. Verifique a imagem enviada e tente novamente.');
    } finally {
      setExporting(false);
    }
  }

  // Agrupa os domingos (4 ou 5) em pares de colunas para o Cartaz
  const discursantesPairs: MuralDiscursanteDom[][] = [];
  for (let i = 0; i < mural.discursantes.length; i += 2) {
    discursantesPairs.push(mural.discursantes.slice(i, i + 2));
  }
  const hasFiveSundays = mural.discursantes.length >= 5;

  function renderPoster(options: {
    ref?: React.Ref<HTMLDivElement>;
    scale?: number;
    clickable?: boolean;
    onClick?: () => void;
  } = {}) {
    const { ref, scale = 1, clickable = false, onClick } = options;
    return (
      <div
        ref={ref}
        className={`mural-poster ${clickable ? 'mural-preview-clickable' : ''}`}
        data-testid="mural-poster-canvas"
        onClick={onClick}
        style={{
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
        }}
      >
        {/* TOPO DO CARTAZ */}
        <div className="mural-poster-header">
          <div className="mural-poster-date">{mural.dataTopo}</div>
          <div className="mural-banner-wrap">
            <img
              src={mural.logoUrl || logoBosqueSagrado}
              alt={mural.alaTitulo || 'BOSQUE SAGRADO'}
              className="mural-banner-img"
            />
          </div>

          <div className="mural-inst-sem-row">
            <div>
              <div className="mural-yellow-title" style={{ fontSize: 20 }}>
                INSTITUTO
              </div>
              <div className="mural-yellow-sub">{mural.institutoTexto}</div>
            </div>
            <div>
              <div className="mural-yellow-title" style={{ fontSize: 20 }}>
                SEMINARIO
              </div>
              <div className="mural-yellow-sub">{mural.seminarioTexto}</div>
            </div>
          </div>
        </div>

        <div className="mural-divider-h" />

        {/* 4 QUADRANTES */}
        <div className="mural-quadrants">
          {/* Q1: Almoço das Sisteres */}
          <div className="mural-quad mural-quad-tl">
            <div style={{ textAlign: 'center' }}>
              <div className="mural-yellow-title" style={{ fontSize: 21 }}>
                Almoço das Sisteres
              </div>
              {mural.mostrarMesAlmoco && mural.mesAlmoco && (
                <div className="mural-yellow-title" style={{ fontSize: 15, marginTop: 1 }}>
                  {mural.mesAlmoco}
                </div>
              )}
            </div>

            <div className="mural-almoco-list">
              {mural.almocoSisteres.map((row, idx) => (
                <div
                  key={idx}
                  className={`mural-almoco-row ${row.destaque ? 'highlight' : ''}`}
                >
                  <div>• {row.dia}</div>
                  <div style={{ textAlign: 'center' }}>{row.diaSemana}</div>
                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.responsavel || ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Q2: Discursantes (4 ou 5 Domingos do Mês) */}
          <div className="mural-quad mural-quad-tr">
            <div style={{ textAlign: 'center', marginBottom: hasFiveSundays ? 3 : 6 }}>
              <div className="mural-yellow-title" style={{ fontSize: 21 }}>
                Discursantes
              </div>
            </div>

            {discursantesPairs.map((pair, pIdx) => (
              <div
                key={pIdx}
                className="mural-disc-pair"
                style={{ marginTop: hasFiveSundays ? 3 : 6 }}
              >
                <div
                  className="mural-disc-bar"
                  style={{ fontSize: hasFiveSundays ? 10 : 11 }}
                >
                  <div>{pair[0]?.data || ''}</div>
                  <div>{pair[1]?.data || ''}</div>
                </div>
                <div
                  className="mural-disc-names"
                  style={{
                    fontSize: hasFiveSundays ? 10 : 11,
                    padding: hasFiveSundays ? '2px 4px 3px' : '4px 4px 6px',
                  }}
                >
                  <div>{pair[0]?.nomes || ''}</div>
                  <div>{pair[1]?.nomes || ''}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Q3: Limpeza da Capela & Pão do Sacramento */}
          <div className="mural-quad mural-quad-bl">
            <div>
              <div style={{ textAlign: 'center', marginBottom: 6 }}>
                <div className="mural-yellow-title" style={{ fontSize: 21 }}>
                  Limpeza da Capela
                </div>
              </div>

              {mural.modoLimpeza === 'ala_unica' ? (
                <div className="mural-limpeza-ala-unica-box">
                  <span className="mural-stroke-white" style={{ fontSize: 18, letterSpacing: '0.02em' }}>
                    {mural.limpezaAlaUnica || 'Ala Planaltina'}
                  </span>
                </div>
              ) : (
                <div className="mural-limpeza-list">
                  {mural.limpezaCapela.map((l, idx) => (
                    <div key={idx} className="mural-limpeza-row">
                      <span className="mural-stroke-white">{l.responsavel}</span>
                      <span style={{ fontWeight: 800 }}> - </span>
                      <span className="mural-stroke-cyan">{l.local}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: mural.modoLimpeza === 'ala_unica' ? 24 : 10 }}>
              <div className="mural-yellow-title" style={{ fontSize: 16 }}>
                Pão do Sacramento
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  fontStyle: 'italic',
                  marginTop: 4,
                  color: '#111111',
                }}
              >
                {mural.paoSacramento}
              </div>
            </div>
          </div>

          {/* Q4: Estudo da Semana */}
          <div className="mural-quad mural-quad-br">
            <div style={{ width: '100%' }}>
              <div className="mural-yellow-title" style={{ fontSize: 21 }}>
                Estudo da Semana
              </div>
              <div className="mural-stroke-cyan" style={{ fontSize: 14, marginTop: 6 }}>
                {mural.estudoSemana.escrituras}
              </div>
            </div>

            <div className="mural-estudo-img-box">
              {mural.estudoSemana.imagemDataUrl ? (
                <img
                  src={mural.estudoSemana.imagemDataUrl}
                  alt={mural.estudoSemana.escrituras}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background:
                      'radial-gradient(circle at 50% 35%, #fef3c7 0%, #b45309 55%, #451a03 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 10,
                    fontSize: 11,
                    fontStyle: 'italic',
                  }}
                >
                  <span style={{ fontSize: 24, marginBottom: 4 }}>📖</span>
                  <span>Faça upload da imagem da semana na aba "Estudo da Semana"</span>
                </div>
              )}
            </div>

            <div className="mural-stroke-orange" style={{ fontSize: 12.5, paddingInline: 4 }}>
              {mural.estudoSemana.tema}
            </div>
          </div>
        </div>

        {/* RODAPÉ: Anúncios (opcional) */}
        {mural.mostrarAnuncios && mural.anuncios && mural.anuncios.length > 0 && (
          <>
            <div className="mural-divider-h" />
            <div className="mural-footer">
              <div style={{ textAlign: 'center' }}>
                <span className="mural-yellow-title" style={{ fontSize: 14 }}>
                  Anúncios
                </span>
              </div>
              <div className="mural-anuncios-grid">
                {mural.anuncios.map((an, idx) => (
                  <div key={idx}>
                    <div style={{ fontWeight: 800, whiteSpace: 'pre-line' }}>• {an.titulo}</div>
                    <div style={{ marginTop: 2, whiteSpace: 'pre-line' }}>{an.texto}</div>
                    {an.link && (
                      <div
                        style={{
                          marginTop: 2,
                          fontSize: 7.5,
                          wordBreak: 'break-all',
                          fontWeight: 700,
                        }}
                      >
                        {an.link}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h2>Mural Semanal</h2>
          <p className="sub">
            Edite as informações semanais da Ala Bosque Sagrado, acompanhe no pequeno Preview ao lado e baixe a imagem pronta.
          </p>
        </div>
        <div className="btns">
          {statusMsg && (
            <span className="badge badge-success" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
              ✓ {statusMsg}
            </span>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => loadInitialData(true)}
            title="Recarregar os dados mais recentes gravados no Firebase"
          >
            🔄 Recarregar
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSaveServer}
            disabled={saving}
            title="Salvar alterações no banco de dados Firebase"
          >
            {saving ? 'Salvando no Firebase…' : '💾 Salvar no Firebase'}
          </button>
          <button type="button" className="btn pri" onClick={handleDownloadPng} disabled={exporting}>
            {exporting ? 'Gerando imagem…' : '⬇️ Baixar Imagem (PNG)'}
          </button>
        </div>
      </div>

      {/* Datalist global de membros para autocompletar */}
      <datalist id="mural-membros-list">
        {members.map(m => (
          <option key={m.id} value={m.nome}>
            {m.chamado ? `${m.nome} (${m.chamado})` : m.nome}
          </option>
        ))}
      </datalist>

      <div className="mural-layout">
        {/* COLUNA ESQUERDA: Editor por Seções */}
        <div className="stack">
          {/* Seletor rápido de abas de edição */}
          <div className="mural-tabs" role="tablist">
            <button
              type="button"
              className={`mural-tab-btn ${activeTab === 'almoco' ? 'on' : ''}`}
              onClick={() => setActiveTab('almoco')}
            >
              🍽️ Almoço das Sisteres
            </button>
            <button
              type="button"
              className={`mural-tab-btn ${activeTab === 'discursantes' ? 'on' : ''}`}
              onClick={() => setActiveTab('discursantes')}
            >
              🎙️ Discursantes ({mural.discursantes.length} dom)
            </button>
            <button
              type="button"
              className={`mural-tab-btn ${activeTab === 'limpeza' ? 'on' : ''}`}
              onClick={() => setActiveTab('limpeza')}
            >
              🧹 Limpeza da Capela
            </button>
            <button
              type="button"
              className={`mural-tab-btn ${activeTab === 'estudo' ? 'on' : ''}`}
              onClick={() => setActiveTab('estudo')}
            >
              📖 Estudo da Semana
            </button>
            <button
              type="button"
              className={`mural-tab-btn ${activeTab === 'extras' ? 'on' : ''}`}
              onClick={() => setActiveTab('extras')}
            >
              ⚙️ Topo & Anúncios
            </button>
          </div>

          {/* Barra rápida de Data do Cartaz e Mês */}
          <section className="card" style={{ padding: '14px 18px' }}>
            <div className="two">
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Data no Topo da Imagem (DD/MM/AA)</label>
                <input
                  className="inp"
                  value={mural.dataTopo}
                  onChange={e => handleDataTopoChange(e.target.value)}
                  placeholder="Ex.: 25/10/26"
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Mês de Referência (Calcula os 4 ou 5 Domingos)</label>
                <select
                  className="inp"
                  value={mural.mesAlmoco}
                  onChange={e => handleMonthChange(e.target.value)}
                >
                  {MESES_NOMES.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* ABA 1: ALMOÇO DAS SISTERES */}
          {activeTab === 'almoco' && (
            <section className="card stack">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h3>Almoço das Sisteres</h3>
                  <p className="sub">Defina os dias da semana e as famílias responsáveis pelo almoço das missionárias.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-secondary sm"
                    onClick={handleFillCurrentWeekAlmoco}
                    title="Preenche automaticamente os 7 dias da semana atual (Segunda a Domingo, com Segunda como Pday)"
                  >
                    📅 Preencher Semana Atual
                  </button>
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() =>
                      updateMural(p => ({
                        ...p,
                        almocoSisteres: [
                          ...p.almocoSisteres,
                          { dia: 'Dia ', diaSemana: 'Quinta', responsavel: '', destaque: false },
                        ],
                      }))
                    }
                  >
                    + Adicionar dia
                  </button>
                </div>
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--color-primary-light)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: '0.85rem' }}>
                  <strong>Semana Completa (Segunda a Domingo):</strong> Segunda-feira é o 1º dia como <em>P-Day</em>.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(mural.mostrarMesAlmoco)}
                      onChange={e => updateMural(p => ({ ...p, mostrarMesAlmoco: e.target.checked }))}
                    />
                    Exibir mês no cartaz ({mural.mesAlmoco})
                  </label>
                  <span className="badge badge-info">
                    {mural.almocoSisteres.length} dias configurados
                  </span>
                </div>
              </div>

              <div className="stack" style={{ gap: 10 }}>
                {mural.almocoSisteres.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1.6fr auto auto',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    <input
                      className="inp"
                      value={item.dia}
                      onChange={e => {
                        const val = e.target.value;
                        updateMural(p => {
                          const list = [...p.almocoSisteres];
                          list[idx] = { ...list[idx], dia: val };
                          return { ...p, almocoSisteres: list };
                        });
                      }}
                      placeholder="Ex.: Dia 19"
                    />
                    <input
                      className="inp"
                      value={item.diaSemana}
                      onChange={e => {
                        const val = e.target.value;
                        updateMural(p => {
                          const list = [...p.almocoSisteres];
                          list[idx] = { ...list[idx], diaSemana: val };
                          return { ...p, almocoSisteres: list };
                        });
                      }}
                      placeholder="Ex.: Segunda"
                    />
                    <input
                      className="inp"
                      list="mural-membros-list"
                      value={item.responsavel}
                      onChange={e => {
                        const val = e.target.value;
                        updateMural(p => {
                          const list = [...p.almocoSisteres];
                          list[idx] = { ...list[idx], responsavel: val };
                          return { ...p, almocoSisteres: list };
                        });
                      }}
                      placeholder="Família / Membro ou Pday"
                    />
                    <label
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}
                      title="Destacar linha com fundo marrom"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(item.destaque)}
                        onChange={e => {
                          const checked = e.target.checked;
                          updateMural(p => {
                            const list = [...p.almocoSisteres];
                            list[idx] = { ...list[idx], destaque: checked };
                            return { ...p, almocoSisteres: list };
                          });
                        }}
                      />
                      Faixa
                    </label>
                    <button
                      type="button"
                      className="btn ghost danger sm"
                      onClick={() =>
                        updateMural(p => ({
                          ...p,
                          almocoSisteres: p.almocoSisteres.filter((_, i) => i !== idx),
                        }))
                      }
                      title="Remover dia"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ABA 2: DISCURSANTES */}
          {activeTab === 'discursantes' && (
            <section className="card stack">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <h3>Discursantes de {mural.mesAlmoco}</h3>
                  <p className="sub">
                    Os <b>{mural.discursantes.length} domingos</b> de {mural.mesAlmoco} são calculados automaticamente do calendário.
                  </p>
                </div>
                <span className="badge badge-info">
                  {mural.discursantes.length} domingos neste mês
                </span>
              </div>

              <div className="two" style={{ gap: 14 }}>
                {mural.discursantes.map((dom, idx) => (
                  <div
                    key={dom.data || idx}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 10,
                      padding: 12,
                      background: 'var(--color-surface-hover)',
                    }}
                    className="stack"
                  >
                    <div className="field">
                      <label>
                        {idx + 1}º Domingo — <b>{dom.data}</b>
                      </label>
                      <input
                        className="inp"
                        value={dom.data}
                        readOnly
                        style={{ opacity: 0.85, fontWeight: 700, cursor: 'default' }}
                        title="Calculado automaticamente pelos domingos do mês selecionado"
                      />
                    </div>

                    <div className="field">
                      <label>Discursantes / Evento</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                        {['Testemunhos', 'Conferencia da Ala', 'Conferência Geral'].map(preset => (
                          <button
                            key={preset}
                            type="button"
                            className="chip sm"
                            style={{ fontSize: 11, padding: '2px 8px' }}
                            onClick={() =>
                              updateMural(p => {
                                const list = [...p.discursantes];
                                list[idx] = { ...list[idx], nomes: preset };
                                return { ...p, discursantes: list };
                              })
                            }
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="inp"
                        rows={3}
                        value={dom.nomes}
                        onChange={e => {
                          const val = e.target.value;
                          updateMural(p => {
                            const list = [...p.discursantes];
                            list[idx] = { ...list[idx], nomes: val };
                            return { ...p, discursantes: list };
                          });
                        }}
                        placeholder="Um nome por linha..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ABA 3: LIMPEZA DA CAPELA & PÃO DO SACRAMENTO */}
          {activeTab === 'limpeza' && (
            <section className="card stack">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h3>Limpeza da Capela & Pão do Sacramento</h3>
                  <p className="sub">
                    Defina se a limpeza é realizada por uma Ala inteira (ex: <b>Ala Planaltina</b>) ou dividida por setores.
                  </p>
                </div>
              </div>

              {/* Seletor de Modo de Limpeza */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: 'var(--color-primary-light)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="modoLimpeza"
                      value="ala_unica"
                      checked={mural.modoLimpeza === 'ala_unica'}
                      onChange={() => updateMural(p => ({ ...p, modoLimpeza: 'ala_unica' }))}
                    />
                    🏛️ Ala Única / Responsável Geral
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="modoLimpeza"
                      value="setores"
                      checked={mural.modoLimpeza !== 'ala_unica'}
                      onChange={() => updateMural(p => ({ ...p, modoLimpeza: 'setores' }))}
                    />
                    🧹 Por Setores Detalhados
                  </label>
                </div>

                {mural.modoLimpeza === 'ala_unica' ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['Ala Planaltina', 'Ala Bosque Sagrado', 'Ala Centro'].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        className="chip sm"
                        onClick={() => updateMural(p => ({ ...p, limpezaAlaUnica: preset }))}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() =>
                      updateMural(p => ({
                        ...p,
                        limpezaCapela: [...p.limpezaCapela, { responsavel: '', local: '' }],
                      }))
                    }
                  >
                    + Adicionar setor
                  </button>
                )}
              </div>

              {/* MODO ALA ÚNICA */}
              {mural.modoLimpeza === 'ala_unica' ? (
                <div className="field" style={{ marginTop: 8 }}>
                  <label>Ala ou Responsável Geral pela Limpeza</label>
                  <input
                    className="inp"
                    value={mural.limpezaAlaUnica || ''}
                    onChange={e => updateMural(p => ({ ...p, limpezaAlaUnica: e.target.value }))}
                    placeholder="Ex.: Ala Planaltina"
                    style={{ fontSize: '1.05rem', fontWeight: 700 }}
                  />
                  <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: 4 }}>
                    No cartaz, o nome será exibido centralizado com destaque abaixo de "Limpeza da Capela", exatamente como no modelo (ex.: <em>Ala Planaltina</em>).
                  </small>
                </div>
              ) : (
                /* MODO POR SETORES */
                <div className="stack" style={{ gap: 8, marginTop: 8 }}>
                  {mural.limpezaCapela.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr auto',
                        gap: 8,
                        alignItems: 'center',
                      }}
                    >
                      <input
                        className="inp"
                        list="mural-membros-list"
                        value={item.responsavel}
                        onChange={e => {
                          const val = e.target.value;
                          updateMural(p => {
                            const list = [...p.limpezaCapela];
                            list[idx] = { ...list[idx], responsavel: val };
                            return { ...p, limpezaCapela: list };
                          });
                        }}
                        placeholder="Responsável (ex.: Mariano ou --------)"
                      />
                      <input
                        className="inp"
                        value={item.local}
                        onChange={e => {
                          const val = e.target.value;
                          updateMural(p => {
                            const list = [...p.limpezaCapela];
                            list[idx] = { ...list[idx], local: val };
                            return { ...p, limpezaCapela: list };
                          });
                        }}
                        placeholder="Setor (ex.: Salão Cultural)"
                      />
                      <button
                        type="button"
                        className="btn ghost danger sm"
                        onClick={() =>
                          updateMural(p => ({
                            ...p,
                            limpezaCapela: p.limpezaCapela.filter((_, i) => i !== idx),
                          }))
                        }
                        title="Remover setor"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="field" style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                <label>🍞 Responsável pelo Pão do Sacramento</label>
                <input
                  className="inp"
                  list="mural-membros-list"
                  value={mural.paoSacramento}
                  onChange={e => updateMural(p => ({ ...p, paoSacramento: e.target.value }))}
                  placeholder="Ex.: Irmã Soeli"
                />
              </div>
            </section>
          )}

          {/* ABA 4: ESTUDO DA SEMANA */}
          {activeTab === 'estudo' && (
            <section className="card stack">
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div>
                  <h3>Estudo da Semana (Vem, e Segue-Me 2026)</h3>
                  <p className="sub">
                    Acesse o manual oficial de 2026 para baixar a imagem da semana e faça o upload abaixo.
                  </p>
                </div>
                <a
                  href={COME_FOLLOW_ME_2026_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn pri sm"
                  style={{ textDecoration: 'none' }}
                >
                  🔗 Abrir Vem, e Segue-Me 2026 ↗
                </a>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: 'var(--color-primary-light)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: '0.85rem' }}>
                  <strong>Preenchimento rápido da semana:</strong> selecione qualquer lição de 2026 ou aplique a semana atual.
                </div>
                <button type="button" className="btn btn-secondary sm" onClick={handleSelectCurrentWeekStudy}>
                  📅 Usar Semana Atual
                </button>
              </div>

              <div className="field">
                <label>Selecionar Lição do Manual Vem, e Segue-Me (Velho Testamento 2026)</label>
                <select
                  className="inp"
                  value={
                    COME_FOLLOW_ME_2026_LESSONS.find(l => l.escrituras === mural.estudoSemana.escrituras)?.id || ''
                  }
                  onChange={e => {
                    const found = COME_FOLLOW_ME_2026_LESSONS.find(l => l.id === e.target.value);
                    if (found) {
                      updateMural(p => ({
                        ...p,
                        estudoSemana: {
                          ...p.estudoSemana,
                          periodo: found.periodo,
                          escrituras: found.escrituras,
                          tema: found.tema,
                        },
                      }));
                    }
                  }}
                >
                  <option value="">-- Personalizado / Escolher da lista --</option>
                  {COME_FOLLOW_ME_2026_LESSONS.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.periodo} — {l.escrituras} ({l.tema})
                    </option>
                  ))}
                </select>
              </div>

              <div className="two">
                <div className="field">
                  <label>Referência das Escrituras (Texto Azul)</label>
                  <input
                    className="inp"
                    value={mural.estudoSemana.escrituras}
                    onChange={e =>
                      updateMural(p => ({
                        ...p,
                        estudoSemana: { ...p.estudoSemana, escrituras: e.target.value },
                      }))
                    }
                    placeholder="Ex.: Isaías 40–49"
                  />
                </div>
                <div className="field">
                  <label>Tema / Citação (Texto Laranja)</label>
                  <input
                    className="inp"
                    value={mural.estudoSemana.tema}
                    onChange={e =>
                      updateMural(p => ({
                        ...p,
                        estudoSemana: { ...p.estudoSemana, tema: e.target.value },
                      }))
                    }
                    placeholder="Ex.: “Consolai o meu povo”"
                  />
                </div>
              </div>

              <div className="field">
                <label>Upload da Imagem do Estudo da Semana</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="inp"
                    style={{ maxWidth: 340 }}
                  />
                  {mural.estudoSemana.imagemDataUrl && (
                    <button
                      type="button"
                      className="btn ghost danger sm"
                      onClick={() => {
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        updateMural(p => ({
                          ...p,
                          estudoSemana: { ...p.estudoSemana, imagemDataUrl: '' },
                        }));
                      }}
                    >
                      Remover Imagem
                    </button>
                  )}
                </div>
                <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: 4 }}>
                  1. Clique em <b>“Abrir Vem, e Segue-Me 2026”</b> acima • 2. Salve a imagem da lição da semana atual no seu dispositivo • 3. Selecione o arquivo aqui.
                </small>
              </div>
            </section>
          )}

          {/* ABA 5: EXTRAS (CABEÇALHO E ANÚNCIOS) */}
          {activeTab === 'extras' && (
            <section className="card stack">
              <div>
                <h3>Cabeçalho (Logotipo / Instituto / Seminário) & Anúncios</h3>
                <p className="sub">Ajuste os horários fixos do topo, o logotipo oficial ou os anúncios do rodapé do cartaz.</p>
              </div>

              <div className="field">
                <label>Logotipo Oficial do Topo (Faixa Bosque Sagrado)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <img
                    src={mural.logoUrl || logoBosqueSagrado}
                    alt="Logo Bosque Sagrado"
                    style={{ height: 44, objectFit: 'contain', background: '#f5f5f4', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--color-border)' }}
                  />
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="inp"
                    style={{ maxWidth: 280 }}
                  />
                  {mural.logoUrl && (
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => {
                        if (logoInputRef.current) logoInputRef.current.value = '';
                        updateMural(p => ({ ...p, logoUrl: '' }));
                      }}
                    >
                      Restaurar Logo Padrão
                    </button>
                  )}
                </div>
                <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: 4 }}>
                  O logotipo esculpido oficial da Ala Bosque Sagrado já está configurado por padrão.
                </small>
              </div>

              <div className="two">
                <div className="field">
                  <label>Horários do Instituto</label>
                  <textarea
                    className="inp"
                    rows={3}
                    value={mural.institutoTexto}
                    onChange={e => updateMural(p => ({ ...p, institutoTexto: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label>Horários do Seminário</label>
                  <textarea
                    className="inp"
                    rows={3}
                    value={mural.seminarioTexto}
                    onChange={e => updateMural(p => ({ ...p, seminarioTexto: e.target.value }))}
                  />
                </div>
              </div>

              <div className="field" style={{ paddingTop: 10, borderTop: '1px solid var(--color-border)', marginBottom: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={mural.mostrarAnuncios !== false}
                    onChange={e => updateMural(p => ({ ...p, mostrarAnuncios: e.target.checked }))}
                  />
                  📢 Exibir rodapé de Anúncios no Cartaz
                </label>
                <small style={{ color: 'var(--color-text-muted)' }}>
                  Desmarque para ocultar a seção de anúncios no rodapé (como no modelo sem anúncios).
                </small>
              </div>

              {mural.mostrarAnuncios !== false && (
                <div className="two">
                  {mural.anuncios.map((an, idx) => (
                    <div key={idx} className="stack" style={{ gap: 8 }}>
                      <div className="field">
                        <label>Anúncio {idx + 1} — Título</label>
                        <textarea
                          className="inp"
                          rows={2}
                          value={an.titulo}
                          onChange={e => {
                            const val = e.target.value;
                            updateMural(p => {
                              const list = [...p.anuncios];
                              list[idx] = { ...list[idx], titulo: val };
                              return { ...p, anuncios: list };
                            });
                          }}
                        />
                      </div>
                      <div className="field">
                        <label>Anúncio {idx + 1} — Texto</label>
                        <textarea
                          className="inp"
                          rows={3}
                          value={an.texto}
                          onChange={e => {
                            const val = e.target.value;
                            updateMural(p => {
                              const list = [...p.anuncios];
                              list[idx] = { ...list[idx], texto: val };
                              return { ...p, anuncios: list };
                            });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* BARRA DE AÇÕES INFERIOR */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: 8,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
              {statusMsg ? (
                <span className="badge badge-success">✓ {statusMsg}</span>
              ) : (
                <span>As alterações são sincronizadas com o Firebase ao clicar em Salvar.</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleSaveServer}
                disabled={saving}
              >
                {saving ? 'Salvando no Firebase…' : '💾 Salvar no Firebase'}
              </button>
              <button
                type="button"
                className="btn pri"
                onClick={handleDownloadPng}
                disabled={exporting}
              >
                {exporting ? 'Gerando…' : '⬇️ Baixar Imagem'}
              </button>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: Preview Ao Vivo & Miniatura */}
        <div className="mural-preview-sticky">
          <section className="card stack" style={{ padding: 16, gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: 4 }}>
                  Preview Ao Vivo
                </span>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Miniatura do Cartaz</h3>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary sm"
                  onClick={() => setIsZoomModalOpen(true)}
                  title="Ampliar cartaz para leitura confortável"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
                >
                  🔍 Ampliar
                </button>
                <button
                  type="button"
                  className="btn pri sm"
                  onClick={handleDownloadPng}
                  disabled={exporting}
                >
                  {exporting ? 'Gerando…' : '⬇️ Baixar PNG'}
                </button>
              </div>
            </div>

            {/* SELETOR RÁPIDO DE ZOOM NA LATERAL */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                background: 'var(--color-surface-hover)',
                borderRadius: 6,
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Zoom:</span>
                <button
                  type="button"
                  className={`chip sm ${sidebarZoom === 0.7 ? 'active' : ''}`}
                  onClick={() => setSidebarZoom(0.7)}
                  style={{ cursor: 'pointer', padding: '1px 6px', fontSize: '0.72rem' }}
                >
                  70%
                </button>
                <button
                  type="button"
                  className={`chip sm ${sidebarZoom === 0.85 ? 'active' : ''}`}
                  onClick={() => setSidebarZoom(0.85)}
                  style={{ cursor: 'pointer', padding: '1px 6px', fontSize: '0.72rem' }}
                >
                  85%
                </button>
                <button
                  type="button"
                  className={`chip sm ${sidebarZoom === 1.0 ? 'active' : ''}`}
                  onClick={() => setSidebarZoom(1.0)}
                  style={{ cursor: 'pointer', padding: '1px 6px', fontSize: '0.72rem' }}
                >
                  100%
                </button>
              </div>

              <button
                type="button"
                className="btn ghost sm"
                onClick={() => setIsZoomModalOpen(true)}
                style={{ fontSize: '0.72rem', padding: '2px 6px', color: 'var(--color-text-muted)' }}
                title="Abrir em tela cheia para leitura detalhada"
              >
                ⛶ Tela Cheia
              </button>
            </div>

            <div className="mural-preview-stage" data-testid="mural-preview-container">
              <div
                className="mural-preview-scale-box"
                style={{
                  width: Math.round(540 * sidebarZoom),
                  height: Math.round(posterHeight * sidebarZoom),
                  transition: 'width 0.15s ease, height 0.15s ease',
                }}
              >
                {renderPoster({
                  ref: posterRef,
                  scale: sidebarZoom,
                  clickable: true,
                  onClick: () => setIsZoomModalOpen(true),
                })}
                <button
                  type="button"
                  className="mural-preview-overlay-btn"
                  onClick={() => setIsZoomModalOpen(true)}
                  title="Clique para ampliar o cartaz"
                >
                  🔍 Ampliar
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* MODAL DE AMPLIAÇÃO / TELA CHEIA */}
      {isZoomModalOpen && (
        <div
          className="mural-modal-backdrop"
          onClick={e => {
            if (e.target === e.currentTarget) setIsZoomModalOpen(false);
          }}
        >
          <div className="mural-modal-dialog" role="dialog" aria-modal="true">
            <div className="mural-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  Visualização Ampliada do Cartaz
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Ala Bosque Sagrado • Domingo {mural.dataTopo}
                </span>
              </div>

              <div className="mural-modal-controls">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    Zoom:
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary sm"
                    onClick={() => setModalZoom(z => Math.max(0.6, Math.round((z - 0.15) * 100) / 100))}
                    disabled={modalZoom <= 0.6}
                    title="Diminuir Zoom"
                    style={{ padding: '2px 8px', minWidth: 28 }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      minWidth: 44,
                      textAlign: 'center',
                      fontWeight: 800,
                    }}
                  >
                    {Math.round(modalZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary sm"
                    onClick={() => setModalZoom(z => Math.min(1.6, Math.round((z + 0.15) * 100) / 100))}
                    disabled={modalZoom >= 1.6}
                    title="Aumentar Zoom"
                    style={{ padding: '2px 8px', minWidth: 28 }}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => setModalZoom(1.0)}
                    title="Restaurar zoom para 100%"
                    style={{ fontSize: '0.78rem', padding: '2px 8px' }}
                  >
                    100%
                  </button>
                </div>

                <button
                  type="button"
                  className="btn pri sm"
                  onClick={handleDownloadPng}
                  disabled={exporting}
                >
                  {exporting ? 'Gerando…' : '⬇️ Baixar PNG'}
                </button>

                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => setIsZoomModalOpen(false)}
                  aria-label="Fechar"
                  title="Fechar (Esc)"
                  style={{ fontSize: '1.2rem', padding: '2px 8px', lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="mural-modal-body">
              <div
                style={{
                  width: Math.round(540 * modalZoom),
                  height: Math.round(posterHeight * modalZoom),
                  position: 'relative',
                  flexShrink: 0,
                  transition: 'width 0.15s ease, height 0.15s ease',
                }}
              >
                {renderPoster({
                  ref: modalPosterRef,
                  scale: modalZoom,
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
