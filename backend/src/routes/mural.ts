import { Router } from 'express';
import { getDb } from '../config/firebase.js';
import { authenticate, requireWrite } from '../middlewares/auth.js';
import { MuralData } from '../types/index.js';

const router = Router();

export const DEFAULT_MURAL_DATA: MuralData = {
  dataTopo: '25/10/26',
  alaTitulo: 'BOSQUE SAGRADO',
  institutoTexto: 'Sábados as 18h na Capela Bosque\nSabado às 19h na capela do Centro.',
  seminarioTexto: 'Terças e quintas às 18h',
  mesAlmoco: 'Outubro',
  almocoSisteres: [
    { dia: 'Dia 25', diaSemana: 'Domingo', responsavel: 'Leonardo e Angela', destaque: true },
    { dia: 'Dia 26', diaSemana: 'Segunda', responsavel: 'Pday', destaque: false },
    { dia: 'Dia 27', diaSemana: 'Terça', responsavel: 'Bruna', destaque: false },
    { dia: 'Dia 28', diaSemana: 'Quarta', responsavel: 'Rebeca', destaque: false },
  ],
  discursantes: [
    { data: 'DIA 04/10', nomes: 'Conferência Geral' },
    { data: 'DIA 11/10', nomes: 'Testemunhos' },
    { data: 'DIA 18/10', nomes: 'Rebeca\nSister\nBruno Almeida' },
    { data: 'DIA 25/10', nomes: 'Camila Bueno\nCarlos Fagundes\nIvan da Rosa' },
  ],
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
    periodo: '19 a 25 de outubro',
    escrituras: 'Jeremias 1–3; 7; 16–18; 20',
    tema: '“Antes que te formasse no ventre, te conheci”',
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
