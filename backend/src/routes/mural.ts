import { Router } from 'express';
import { getDb } from '../config/firebase.js';
import { authenticate, requireWrite } from '../middlewares/auth.js';
import { MuralData } from '../types/index.js';

const router = Router();

export const DEFAULT_MURAL_DATA: MuralData = {
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

router.get('/', authenticate, async (_req, res) => {
  try {
    const db = getDb();
    const docSnap = await db.doc('config/mural').get();
    if (!docSnap.exists) {
      return res.json(DEFAULT_MURAL_DATA);
    }
    res.json({ ...DEFAULT_MURAL_DATA, ...docSnap.data() });
  } catch (error) {
    console.error('Error fetching mural data:', error);
    res.json(DEFAULT_MURAL_DATA);
  }
});

router.put('/', authenticate, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const payload: Partial<MuralData> = req.body || {};
    const updated: MuralData = {
      ...DEFAULT_MURAL_DATA,
      ...payload,
      atualizadoEm: Date.now(),
    };
    await db.doc('config/mural').set(updated, { merge: true });
    res.json(updated);
  } catch (error) {
    console.error('Error saving mural data:', error);
    res.status(500).json({ error: 'Erro ao salvar dados do mural.' });
  }
});

export default router;
