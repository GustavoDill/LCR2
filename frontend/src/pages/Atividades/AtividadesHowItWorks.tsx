import React from 'react';

export const AtividadesHowItWorks: React.FC = () => {
  return (
    <div className="atv-how-card">
      <div className="atv-how-head">
        <span style={{ color: '#ef4444' }}>⚑</span>
        <span>Como funciona</span>
      </div>

      <ol className="atv-how-list">
        <li>
          O líder da organização toca em <strong>"Nova solicitação de atividade"</strong> e preenche o modelo: data, local, reserva da capela, propósito, custo e líderes de apoio.
        </li>
        <li>
          A solicitação entra em <span style={{ color: '#ef4444', fontWeight: 600 }}>Aguardando aprovação</span> e o bispado é avisado na Visão geral.
        </li>
        <li>
          O bispado aprova, pede ajustes ou não aprova, com um comentário. Atividades aprovadas ficam em <span style={{ color: '#10b981', fontWeight: 600 }}>verde</span> e podem ir direto para a Agenda da ala.
        </li>
        <li>
          Envie com pelo menos 2 semanas de antecedência e reserve a capela antes de enviar.
        </li>
        <li>
          Depois da atividade, abra a atividade aprovada e toque em <strong>"Enviar feedback"</strong>: conte o sucesso alcançado e quantos membros e não membros participaram.
        </li>
      </ol>
    </div>
  );
};
