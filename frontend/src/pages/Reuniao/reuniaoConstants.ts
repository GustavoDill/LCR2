export const MEET_INFO = {
  bispado: {
    l: 'Reunião de Bispado',
    q: 'O que precisamos decidir, resolver ou acompanhar como liderança?',
    who: 'Bispo, 1º e 2º conselheiros, secretário da ala e secretário executivo',
  },
  conselho: {
    l: 'Conselho da Ala',
    q: 'O que precisamos fazer juntos para abençoar os membros?',
    who: 'Bispado, secretários e presidentes do Quórum de Élderes, Sociedade de Socorro, Moças, Primária e Escola Dominical',
  },
};

export interface MeetingSection {
  k: string;
  t: string;
  min: number;
  q?: string;
  warn?: string;
  items?: string[];
  questions?: string[];
  groups?: Array<{ g: string; i: string[] }>;
}

export const PAUTA: Record<'bispado' | 'conselho', MeetingSection[]> = {
  bispado: [
    { k: 'A', t: 'Abertura espiritual', min: 5, items: ['Oração', 'Estudo breve das escrituras', 'Impressões e revelação recebidas', 'Prioridades espirituais da semana'] },
    { k: 'B', t: 'Designações anteriores', min: 5, q: 'Nenhuma reunião termina sem deixar claro quem fará o quê e até quando.' },
    { k: 'C', t: 'Pessoas e famílias', min: 10, items: ['Famílias que precisam de apoio', 'Membros afastados', 'Membros novos e conversos recentes', 'Jovens que precisam de acompanhamento', 'Crianças que precisam de atenção', 'Membros retornando à atividade', 'Situações que exigem o bispo', 'Famílias que precisam de fortalecimento espiritual'], warn: 'Assuntos pessoais e confidenciais ficam no bispado e não vão ao Conselho da Ala sem necessidade.' },
    { k: 'D', t: 'Jovens', min: 6, groups: [{ g: 'Rapazes', i: ['Diáconos', 'Mestres', 'Sacerdotes', 'Frequência e participação', 'Progresso no sacerdócio', 'Preparação para o Sacerdócio de Melquisedeque', 'Entrevistas', 'Futuros missionários'] }, { g: 'Moças', i: ['Frequência e participação', 'Classes', 'Progresso', 'Entrevistas', 'Necessidades individuais', 'Preparação espiritual'] }, { g: 'Eventos', i: ['Acampamentos', 'FSY', 'Conferências', 'Atividades'] }] },
    { k: 'E', t: 'Ordenanças e progresso', min: 4, items: ['Batismo e confirmação', 'Sacerdócio Aarônico', 'Sacerdócio de Melquisedeque', 'Investidura', 'Selamento', 'Recomendações para o templo', 'Batismos vicários'] },
    { k: 'F', t: 'Chamados da ala', min: 5, groups: [{ g: 'Chamados existentes', i: ['Quem precisa ser desobrigado?', 'Quem precisa de apoio?', 'Algum chamado sem funcionamento?', 'Alguma organização precisa de mais pessoas?'] }, { g: 'Novos chamados', i: ['Possíveis nomes', 'Aprovação do bispado', 'Entrevistas', 'Apoios', 'Designações'] }] },
    { k: 'G', t: 'Trabalho missionário', min: 4, items: ['Missionários de tempo integral', 'Pessoas sendo ensinadas', 'Amigos da Igreja', 'Batismos previstos', 'Missionários retornados', 'Jovens preparando-se para a missão', 'Necessidades dos missionários'] },
    { k: 'H', t: 'Templo e história da família', min: 3, items: ['Recomendações a renovar', 'Jovens preparando-se para o templo', 'Batismos vicários', 'Viagens ao templo', 'Curso de preparação para o templo', 'Plano de templo e história da família da ala'] },
    { k: 'I', t: 'Necessidades temporais', min: 3, items: ['Alimentação', 'Moradia', 'Emprego', 'Transporte', 'Emergências', 'Fundo de jejum', 'Autossuficiência', 'Encaminhamentos'], warn: 'Tratar com total confidencialidade.' },
    { k: 'J', t: 'Finanças da ala', min: 3, items: ['Orçamento e saldo', 'Gastos realizados', 'Próximas despesas', 'Aprovação de despesas', 'Necessidades das organizações', 'Prestação de contas'] },
    { k: 'K', t: 'Registros e administração', min: 2, items: ['Relatórios e frequência', 'Registros de membros', 'Mudanças de endereço e transferências', 'Crianças chegando à idade de ordenanças', 'Pendências administrativas'] },
    { k: 'L', t: 'Reuniões e calendário', min: 3, items: ['Reunião sacramental', 'Conselho da Ala', 'Conselho de Jovens', 'Atividades e conferências', 'Visitas da presidência da estaca', 'Batismos e ordenanças'] },
    { k: 'M', t: 'Treinamento dos líderes', min: 2, q: 'Qual líder ou organização precisa de mais apoio do bispado esta semana?', items: ['Presidentes de quórum', 'Sociedade de Socorro', 'Moças', 'Primária', 'Escola Dominical', 'Secretários', 'Líderes missionários e de templo'] },
    { k: 'N', t: 'Instruções da Igreja', min: 2, items: ['Manual Geral', 'Escrituras', 'Cartas da Primeira Presidência', 'Presidência de Área', 'Presidência da Estaca', 'Treinamentos recentes'] },
    { k: 'O', t: 'Planejamento das próximas semanas', min: 3, questions: ['O que acontecerá nos próximos 7 dias?', 'O que acontecerá nos próximos 30 dias?', 'Que risco ou problema precisamos antecipar?', 'Qual é a maior prioridade espiritual da ala agora?'] },
  ],
  conselho: [
    { k: '1', t: 'Abertura', min: 3, items: ['Oração', 'Mensagem', 'Propósito da reunião'] },
    { k: '2', t: 'Designações anteriores', min: 5, questions: ['O que foi feito?', 'O que não foi feito, e por quê?', 'Quem continua responsável?'] },
    { k: '3', t: 'Situação espiritual da ala', min: 6, q: 'Quem precisa de nós?', items: ['Frequência e participação', 'Membros afastados', 'Novos membros e conversos', 'Famílias que precisam de apoio', 'Jovens', 'Crianças', 'Idosos', 'Pessoas que precisam de integração'] },
    { k: '4', t: 'Fortalecimento dos membros', min: 8, groups: [{ g: 'Quórum de Élderes', i: ['Homens', 'Famílias', 'Ministração', 'Necessidades temporais', 'Sacerdócio'] }, { g: 'Sociedade de Socorro', i: ['Mulheres', 'Famílias', 'Ministração', 'Necessidades', 'Fortalecimento espiritual'] }, { g: 'Moças', i: ['Jovens', 'Integração', 'Participação', 'Atividades'] }, { g: 'Primária', i: ['Crianças', 'Famílias', 'Frequência', 'Transição para os jovens'] }, { g: 'Escola Dominical', i: ['Professores', 'Qualidade das aulas', 'Participação', 'Treinamento'] }] },
    { k: '5', t: 'Trabalho missionário', min: 5, questions: ['Quem podemos convidar?', 'Quem está sendo ensinado?', 'Quem precisa de um amigo?', 'Quem precisa retornar à Igreja?', 'Quais famílias podem ajudar?', 'Que atividades servem para integração?'] },
    { k: '6', t: 'Templo e história da família', min: 4, items: ['Quem pode ir ao templo?', 'Jovens e batismos vicários', 'Famílias', 'Preparação para o templo', 'Atividades de história da família'] },
    { k: '7', t: 'Jovens', min: 5, items: ['Frequência e participação', 'Atividades, FSY e acampamentos', 'Seminário', 'Preparação missionária', 'Preparação para o templo', 'Jovens que precisam de integração', 'Jovens que precisam de um líder ou mentor'] },
    { k: '8', t: 'Crianças', min: 3, items: ['Frequência', 'Professores', 'Necessidades especiais', 'Transição para Moças e Quórum', 'Proteção e segurança'] },
    { k: '9', t: 'Ministração', min: 5, items: ['Famílias sem contato', 'Necessidades identificadas', 'Designações de ministração', 'Casos que precisam de apoio', 'Integração entre organizações'] },
    { k: '10', t: 'Autossuficiência e necessidades temporais', min: 3, items: ['Emprego', 'Educação', 'Alimentação', 'Moradia', 'Finanças familiares', 'Emergências', 'Recursos da Igreja'] },
    { k: '11', t: 'Atividades da ala', min: 3, q: 'Qual é o propósito desta atividade?', items: ['Fortalecimento espiritual', 'Integração', 'Missionário', 'Família', 'Jovens', 'Crianças', 'Templo', 'Serviço', 'Autossuficiência'] },
    { k: '12', t: 'Frequência e retenção', min: 3, items: ['Aumentar participação', 'Recuperar membros', 'Integrar novos membros', 'Evitar que pessoas se afastem'] },
    { k: '13', t: 'Ensino do evangelho', min: 2, items: ['Professores', 'Necessidades de treinamento', 'Qualidade do ensino', 'Participação dos alunos'] },
    { k: '14', t: 'Calendário e prioridades', min: 3, items: ['Conflitos de calendário', 'Recursos e transporte', 'Responsáveis', 'Comunicação e divulgação'] },
    { k: '15', t: 'Metas da ala', min: 2, items: ['Acompanhamento das metas estabelecidas'] },
  ],
};
