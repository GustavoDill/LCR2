import { MuralData } from '../../types';

export const COME_FOLLOW_ME_2026_URL =
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

export const DIAS_DA_SEMANA_NOMES = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
];

export interface ComeFollowMeLessonPreset {
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
    tema: '“Um coração novo vos darei”',
  },
  {
    id: '46',
    start: '2026-11-09',
    end: '2026-11-15',
    periodo: '9 a 15 de novembro',
    escrituras: 'Daniel 1–6',
    tema: '“Não há outro Deus que possa salvar desta maneira”',
  },
  {
    id: '47',
    start: '2026-11-16',
    end: '2026-11-22',
    periodo: '16 a 22 de novembro',
    escrituras: 'Oséias 1–6; 10–14; Joel',
    tema: '“Eu vos amarei voluntariamente”',
  },
  {
    id: '48',
    start: '2026-11-23',
    end: '2026-11-29',
    periodo: '23 a 29 de novembro',
    escrituras: 'Amós; Obadias',
    tema: '“Buscai ao Senhor, e vivei”',
  },
  {
    id: '49',
    start: '2026-11-30',
    end: '2026-12-06',
    periodo: '30 de novembro a 6 de dezembro',
    escrituras: 'Jonas; Miqueias',
    tema: '“O que pede o Senhor de ti?”',
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

export function getCurrentWeekLesson(): ComeFollowMeLessonPreset {
  const todayIso = new Date().toISOString().split('T')[0];
  const match = COME_FOLLOW_ME_2026_LESSONS.find(l => todayIso >= l.start && todayIso <= l.end);
  return match || COME_FOLLOW_ME_2026_LESSONS.find(l => l.id === '37') || COME_FOLLOW_ME_2026_LESSONS[1];
}

export function getInitialMuralState(): MuralData {
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
