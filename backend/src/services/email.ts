import nodemailer, { Transporter } from 'nodemailer';

interface DecisionEmailParams {
  to: string;
  solicitanteNome: string;
  atividadeTitulo: string;
  dataAtividade: string;
  organizacao: string;
  status: 'aprovada' | 'ajustes' | 'recusada';
  comentario?: string;
  decididoPorNome?: string;
}

let transporterInstance: Transporter | null = null;

export function getEmailTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  if (!transporterInstance) {
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    transporterInstance = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  return transporterInstance;
}

export async function sendActivityDecisionEmail(params: DecisionEmailParams): Promise<boolean> {
  const {
    to,
    solicitanteNome,
    atividadeTitulo,
    dataAtividade,
    organizacao,
    status,
    comentario,
    decididoPorNome,
  } = params;

  if (!to) {
    console.warn('[EmailService] Destinatário de e-mail não informado.');
    return false;
  }

  const transporter = getEmailTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@alabosque.org';

  let subject = '';
  let statusBadge = '';
  let statusColor = '#2563eb';
  let messageTitle = '';
  let messageBody = '';

  if (status === 'aprovada') {
    subject = `✅ Atividade Aprovada: ${atividadeTitulo} - Ala Bosque`;
    statusBadge = 'APROVADA';
    statusColor = '#16a34a'; // verde
    messageTitle = 'Sua solicitação de atividade foi aprovada!';
    messageBody = `
      <p style="font-size: 15px; color: #374151; line-height: 1.6;">
        Olá <strong>${escapeHtml(solicitanteNome)}</strong>,
      </p>
      <p style="font-size: 15px; color: #374151; line-height: 1.6;">
        Temos uma ótima notícia! O Bispado analisou e <strong>APROVOU</strong> a realização da atividade <strong>"${escapeHtml(atividadeTitulo)}"</strong> da organização <strong>${escapeHtml(organizacao)}</strong> planejada para o dia <strong>${escapeHtml(dataAtividade)}</strong>.
      </p>
      ${
        comentario
          ? `
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; margin: 18px 0; border-radius: 4px;">
          <strong style="color: #166534; display: block; margin-bottom: 4px;">Mensagem do Bispado:</strong>
          <span style="color: #1f2937; white-space: pre-line;">${escapeHtml(comentario)}</span>
        </div>`
          : ''
      }
      <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">
        A atividade já está registrada e constará na Agenda oficial da ala. Bom trabalho na preparação!
      </p>
    `;
  } else if (status === 'ajustes') {
    subject = `⚠️ Alterações Solicitadas: ${atividadeTitulo} - Ala Bosque`;
    statusBadge = 'ALTERAÇÕES SOLICITADAS';
    statusColor = '#d97706'; // amarelo/laranja
    messageTitle = 'O Bispado solicitou ajustes na sua atividade';
    messageBody = `
      <p style="font-size: 15px; color: #374151; line-height: 1.6;">
        Olá <strong>${escapeHtml(solicitanteNome)}</strong>,
      </p>
      <p style="font-size: 15px; color: #374151; line-height: 1.6;">
        O Bispado analisou a solicitação da atividade <strong>"${escapeHtml(atividadeTitulo)}"</strong> (${escapeHtml(organizacao)}) e solicitou algumas <strong>alterações ou esclarecimentos</strong> antes de concluir a aprovação.
      </p>
      <div style="background-color: #fffbeb; border-left: 4px solid #d97706; padding: 14px 16px; margin: 18px 0; border-radius: 4px;">
        <strong style="color: #92400e; display: block; margin-bottom: 6px; font-size: 15px;">Instruções do Bispado para ajustes:</strong>
        <span style="color: #1f2937; font-size: 14px; line-height: 1.6; white-space: pre-line;">${escapeHtml(comentario || 'Por favor, revise os detalhes da atividade no sistema.')}</span>
      </div>
      <p style="font-size: 14px; color: #374151; line-height: 1.6;">
        👉 <strong>Como proceder:</strong> Acesse o sistema do Bispado, localize seu ticket na aba de <em>Atividades</em>, clique em <strong>"Editar e Reenviar"</strong> com as correções solicitadas.
      </p>
    `;
  } else {
    subject = `❌ Atividade Não Aprovada: ${atividadeTitulo} - Ala Bosque`;
    statusBadge = 'NÃO APROVADA';
    statusColor = '#dc2626'; // vermelho
    messageTitle = 'Solicitação de atividade não aprovada';
    messageBody = `
      <p style="font-size: 15px; color: #374151; line-height: 1.6;">
        Olá <strong>${escapeHtml(solicitanteNome)}</strong>,
      </p>
      <p style="font-size: 15px; color: #374151; line-height: 1.6;">
        Informamos que a solicitação para a atividade <strong>"${escapeHtml(atividadeTitulo)}"</strong> da organização <strong>${escapeHtml(organizacao)}</strong> <strong>NÃO FOI APROVADA</strong> pelo Bispado.
      </p>
      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 14px 16px; margin: 18px 0; border-radius: 4px;">
        <strong style="color: #991b1b; display: block; margin-bottom: 6px; font-size: 15px;">Motivo da reprovação:</strong>
        <span style="color: #1f2937; font-size: 14px; line-height: 1.6; white-space: pre-line;">${escapeHtml(comentario || 'Não foram informados detalhes adicionais.')}</span>
      </div>
      <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">
        Caso tenha dúvidas ou queira conversar a respeito, entre em contato diretamente com um membro do Bispado.
      </p>
    `;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(subject)}</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <tr>
          <td style="background-color: #0f172a; padding: 24px 30px; text-align: left;">
            <div style="color: #ffffff; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">BISPADO ALA BOSQUE</div>
            <div style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Sistema de Gestão e Solicitações</div>
          </td>
        </tr>

        <!-- Status Bar -->
        <tr>
          <td style="padding: 16px 30px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <span style="display: inline-block; background-color: ${statusColor}; color: #ffffff; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.5px;">
              ${statusBadge}
            </span>
            <span style="margin-left: 10px; font-size: 13px; color: #64748b;">
              Ticket de Atividade: <strong>${escapeHtml(atividadeTitulo)}</strong>
            </span>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding: 30px;">
            <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 19px; font-weight: 600;">
              ${messageTitle}
            </h2>

            ${messageBody}

            <table border="0" cellpadding="6" cellspacing="0" width="100%" style="margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 13px; color: #4b5563;">
              <tr>
                <td width="30%" style="color: #9ca3af;">Atividade:</td>
                <td style="font-weight: 600; color: #1f2937;">${escapeHtml(atividadeTitulo)}</td>
              </tr>
              <tr>
                <td style="color: #9ca3af;">Organização:</td>
                <td>${escapeHtml(organizacao)}</td>
              </tr>
              <tr>
                <td style="color: #9ca3af;">Data prevista:</td>
                <td>${escapeHtml(dataAtividade)}</td>
              </tr>
              ${
                decididoPorNome
                  ? `<tr><td style="color: #9ca3af;">Analisado por:</td><td>${escapeHtml(decididoPorNome)}</td></tr>`
                  : ''
              }
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #f8fafc; padding: 18px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            Este é um e-mail automático gerado pelo sistema do Bispado da Ala Bosque. Por favor, não responda diretamente a esta mensagem.
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const textContent = `
[Bispado Ala Bosque - Solicitação de Atividade]
Status: ${statusBadge}
Atividade: ${atividadeTitulo}
Organização: ${organizacao}
Data: ${dataAtividade}

Olá ${solicitanteNome},

${messageTitle}

${comentario ? `Comentário do Bispado:\n${comentario}\n` : ''}

Acesse o sistema para mais detalhes.
  `.trim();

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[SIMULAÇÃO DE E-MAIL - SMTP NÃO CONFIGURADO]`);
    console.log(`Para: ${to} (${solicitanteNome})`);
    console.log(`Assunto: ${subject}`);
    console.log(`Status: ${statusBadge}`);
    console.log(`Comentário: ${comentario || '(nenhum)'}`);
    console.log(`(Configure as variáveis SMTP no arquivo .env / Render para envio real)`);
    console.log(`======================================================\n`);
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });
    console.log(`[EmailService] E-mail de decisão enviado com sucesso para ${to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[EmailService] Erro ao enviar e-mail para ${to}:`, error);
    return false;
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
