import { Router } from 'express';
import { getDb } from '../config/firebase.js';
import { authenticate, requireBishopric, requireWrite } from '../middlewares/auth.js';

const router = Router();

const DEFAULT_ORGS = [
  {
    nome: 'Bispado e Secretaria',
    grupo: 'Bispado e secretaria',
    ordem: 1,
    cargos: [
      { id: 'c-bisp', titulo: 'Bispo', pessoa: 'Gustavo Dill', desde: '2024-01-14', fixo: true },
      { id: 'c-1c', titulo: '1º Conselheiro no Bispado', pessoa: 'Carlos Eduardo', desde: '2024-01-14' },
      { id: 'c-2c', titulo: '2º Conselheiro no Bispado', pessoa: 'Marcos Silva', desde: '2024-01-14' },
      { id: 'c-sec', titulo: 'Secretário da Ala', pessoa: 'Lucas Pereira', desde: '2024-02-01' },
      { id: 'c-sece', titulo: 'Secretário Executivo', pessoa: 'André Santos', desde: '2024-02-15' },
    ],
  },
  {
    nome: 'Quórum de Élderes',
    grupo: 'Quórum de Élderes e Sociedade de Socorro',
    ordem: 2,
    cargos: [
      { id: 'c-pqe', titulo: 'Presidente do Quórum de Élderes', pessoa: 'Rodrigo Barbosa', desde: '2023-11-10' },
      { id: 'c-1qe', titulo: '1º Conselheiro no Quórum de Élderes', pessoa: 'Felipe Rocha', desde: '2023-11-10' },
      { id: 'c-2qe', titulo: '2º Conselheiro no Quórum de Élderes', pessoa: 'Mateus Costa', desde: '2023-12-05' },
      { id: 'c-sqe', titulo: 'Secretário do Quórum de Élderes', pessoa: '', desde: '' },
    ],
  },
  {
    nome: 'Sociedade de Socorro',
    grupo: 'Quórum de Élderes e Sociedade de Socorro',
    ordem: 3,
    cargos: [
      { id: 'c-pss', titulo: 'Presidente da Sociedade de Socorro', pessoa: 'Ana Paula Dill', desde: '2024-01-20' },
      { id: 'c-1ss', titulo: '1ª Conselheira na Sociedade de Socorro', pessoa: 'Mariana Lima', desde: '2024-01-20' },
      { id: 'c-2ss', titulo: '2ª Conselheira na Sociedade de Socorro', pessoa: 'Juliana Mendes', desde: '2024-02-01' },
      { id: 'c-sss', titulo: 'Secretária da Sociedade de Socorro', pessoa: 'Beatriz Ramos', desde: '2024-02-01' },
    ],
  },
  {
    nome: 'Organização das Moças',
    grupo: 'Classes das Moças',
    ordem: 4,
    cargos: [
      { id: 'c-pmoc', titulo: 'Presidente das Moças', pessoa: 'Fernanda Oliveira', desde: '2024-03-01' },
      { id: 'c-1moc', titulo: '1ª Conselheira nas Moças', pessoa: 'Carla Nogueira', desde: '2024-03-01' },
      { id: 'c-2moc', titulo: '2ª Conselheira nas Moças', pessoa: '', desde: '' },
    ],
  },
  {
    nome: 'Primária',
    grupo: 'Organizações da ala',
    ordem: 5,
    cargos: [
      { id: 'c-ppri', titulo: 'Presidente da Primária', pessoa: 'Camila Duarte', desde: '2023-09-15' },
      { id: 'c-1pri', titulo: '1ª Conselheira na Primária', pessoa: 'Patricia Souza', desde: '2023-09-15' },
      { id: 'c-2pri', titulo: '2ª Conselheira na Primária', pessoa: 'Vanessa Moreira', desde: '2023-10-01' },
    ],
  },
  {
    nome: 'Escola Dominical',
    grupo: 'Organizações da ala',
    ordem: 6,
    cargos: [
      { id: 'c-ped', titulo: 'Presidente da Escola Dominical', pessoa: 'Gabriel Antunes', desde: '2024-01-10' },
      { id: 'c-1ed', titulo: '1º Conselheiro na Escola Dominical', pessoa: '', desde: '' },
    ],
  },
];

router.post('/init', authenticate, requireBishopric, requireWrite, async (req, res) => {
  try {
    const db = getDb();
    const existing = await db.collection('conf/b/chamados').get();

    if (existing.size > 0 && !req.query.force) {
      return res.json({ message: 'Organizações já cadastradas. Use ?force=true para sobrescrever.' });
    }

    for (let i = 0; i < DEFAULT_ORGS.length; i++) {
      const org = DEFAULT_ORGS[i];
      const orgId = 'org_' + (i + 1);
      await db.doc(`conf/b/chamados/${orgId}`).set({
        id: orgId,
        nome: org.nome,
        grupo: org.grupo,
        ordem: org.ordem,
        cargos: org.cargos,
      });
    }

    // Default current quarter budget
    const today = new Date();
    const curYear = today.getFullYear();
    const curQ = Math.floor(today.getMonth() / 3) + 1;
    const curPeriod = `${curYear}-T${curQ}`;

    await db.doc(`conf/b/financeiro/${curPeriod}`).set({
      periodo: curPeriod,
      recebido: 9600,
      linhas: [
        { id: 'lin-ss', nome: 'Sociedade de Socorro', valor: 1800 },
        { id: 'lin-qe', nome: 'Quórum de Élderes', valor: 1500 },
        { id: 'lin-rap', nome: 'Rapazes', valor: 1600 },
        { id: 'lin-moc', nome: 'Moças', valor: 1600 },
        { id: 'lin-pri', nome: 'Primária', valor: 1400 },
        { id: 'lin-jas', nome: 'Jovens Adultos Solteiros', valor: 600 },
        { id: 'lin-mis', nome: 'Obra Missionária', valor: 600 },
        { id: 'lin-sem', nome: 'Seminário', valor: 500 },
      ],
      atualizadoEm: Date.now(),
    });

    // Default Christmas event
    await db.doc('natal/evento').set({
      nome: 'Festa de Natal da Ala Bosque',
      data: `${curYear}-12-19`,
      inicio: '19:30',
      local: 'Salão Cultural da Capela',
      tema: 'A Luz do Mundo',
      publico: '120',
      orcamento: 1500,
      atualizadoEm: Date.now(),
    });

    res.json({ success: true, message: 'Dados padrão inicializados com sucesso.' });
  } catch (error) {
    console.error('Error seeding data:', error);
    res.status(500).json({ error: 'Erro ao inicializar dados.' });
  }
});

export default router;
