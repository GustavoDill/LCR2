import nodemailer, { Transporter } from 'nodemailer';

export interface DecisionEmailParams {
  to: string;
  solicitanteNome: string;
  atividadeTitulo: string;
  dataAtividade: string;
  organizacao: string;
  status: 'aprovada' | 'ajustes' | 'recusada';
  comentario?: string;
  decididoPorNome?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

let transporterInstance: Transporter | null = null;

function getFromAddress(): string {
  const rawFrom = process.env.SMTP_FROM?.trim();
  if (rawFrom) {
    return rawFrom.replace(/^["']|["']$/g, '');
  }
  const user = process.env.SMTP_USER?.trim().replace(/["']/g, '');
  return user ? `"Bispado Ala Bosque" <${user}>` : 'no-reply@alabosque.org';
}

export function getEmailTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST?.trim().replace(/["']/g, '');
  const user = process.env.SMTP_USER?.trim().replace(/["']/g, '');
  const rawPass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !rawPass) {
    console.warn('[EmailService] Variáveis SMTP ausentes (SMTP_HOST, SMTP_USER ou SMTP_PASS).');
    return null;
  }

  // Remove spaces and quotes that might have been copied with Google App Passwords (e.g. "abcd efgh ijkl mnop")
  const cleanPass = rawPass.replace(/["']/g, '').replace(/\s+/g, '');

  if (!transporterInstance) {
    const isGmail = host === 'smtp.gmail.com' || user.toLowerCase().endsWith('@gmail.com');

    if (isGmail) {
      console.log(`[EmailService] Configurando Nodemailer usando serviço oficial do Gmail para ${user}...`);
      transporterInstance = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass: cleanPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    } else {
      const port = Number(process.env.SMTP_PORT) || 587;
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;

      console.log(`[EmailService] Configurando SMTP personalizado: ${host}:${port} (secure: ${secure}) para ${user}...`);
      transporterInstance = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass: cleanPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }
  }

  return transporterInstance;
}

export async function sendTestEmail(to: string, nomeUsuario: string): Promise<SendEmailResult> {
  const transporter = getEmailTransporter();
  const from = getFromAddress();

  if (!transporter) {
    return {
      success: false,
      simulated: true,
      error: 'Servidor SMTP não configurado. Verifique as variáveis SMTP_HOST, SMTP_USER e SMTP_PASS no Render.',
    };
  }

  try {
    console.log(`[EmailService] Verificando credenciais SMTP com o provedor...`);
    await transporter.verify();
    console.log(`[EmailService] Conexão SMTP autenticada com sucesso! Enviando e-mail de teste para ${to}...`);

    const info = await transporter.sendMail({
      from,
      to,
      subject: '✅ Teste de Conexão SMTP - Bispado Ala Bosque',
      text: `Olá ${nomeUsuario},\n\nEste é um e-mail de teste para confirmar que o servidor SMTP do Bispado da Ala Bosque está configurado e funcionando corretamente no Render!\n\nData do teste: ${new Date().toLocaleString('pt-BR')}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #16a34a; margin-top: 0; font-size: 20px;">✅ Teste de E-mail Bem-Sucedido!</h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.5;">Olá <strong>${escapeHtml(nomeUsuario)}</strong>,</p>
          <p style="color: #374151; font-size: 15px; line-height: 1.5;">Se você recebeu esta mensagem, o envio de e-mails do sistema <strong>Bispado Ala Bosque</strong> no Render está <strong>100% configurado e operacional</strong>!</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #16a34a; padding: 10px 14px; margin: 16px 0; font-size: 13px; color: #64748b;">
            <strong>Conta remetente:</strong> ${escapeHtml(process.env.SMTP_USER || '')}<br>
            <strong>Data do envio:</strong> ${new Date().toLocaleString('pt-BR')}
          </div>
        </div>
      `,
    });

    console.log(`[EmailService] E-mail de teste enviado com sucesso! MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[EmailService] Falha no teste de e-mail:', error);
    // Reset transporterInstance so next attempt can re-read or retry
    transporterInstance = null;
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao conectar com o servidor SMTP.',
    };
  }
}

export async function sendActivityDecisionEmail(params: DecisionEmailParams): Promise<SendEmailResult> {
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
    return {
      success: false,
      error: 'E-mail do solicitante não informado.',
    };
  }

  const transporter = getEmailTransporter();
  const from = getFromAddress();

  let subject = '';
  let statusBadge = '';
  let statusColor = '#2563eb';
  let messageTitle = '';
  let messageBody = '';

  if (status === 'aprovada') {
    subject = `✅ Atividade Aprovada: ${atividadeTitulo} - Ala Bosque`;
    statusBadge = 'APROVADA';
    statusColor = '#16a34a';
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
    statusColor = '#d97706';
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
    statusColor = '#dc2626';
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
        <tr>
          <td style="background-color: #0f172a; padding: 24px 30px; text-align: left;">
            <div style="color: #ffffff; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">BISPADO ALA BOSQUE</div>
            <div style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Sistema de Gestão e Solicitações</div>
          </td>
        </tr>
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
    console.log(`[SIMULAÇÃO DE E-MAIL - SMTP NÃO CONFIGURADO NO RENDER]`);
    console.log(`Para: ${to} (${solicitanteNome})`);
    console.log(`Assunto: ${subject}`);
    console.log(`Status: ${statusBadge}`);
    console.log(`Comentário: ${comentario || '(nenhum)'}`);
    console.log(`======================================================\n`);
    return {
      success: false,
      simulated: true,
      error: 'Servidor SMTP não configurado no backend (SMTP_HOST, SMTP_USER ou SMTP_PASS ausentes no Render).',
    };
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
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[EmailService] Erro ao enviar e-mail para ${to}:`, error);
    return {
      success: false,
      error: error.message || 'Falha ao enviar mensagem pelo servidor SMTP.',
    };
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


export interface AccessRequestEmailParams {
  adminEmails: string[];
  solicitanteNome: string;
  solicitanteEmail: string;
  cargoSolicitado?: string;
  organizacaoSolicitada?: string;
  justificativa?: string;
  dataSolicitacao: string;
  gerenciamentoUrl: string;
}

export async function getAdminRecipientsForNewRegistrations(db: any): Promise<string[]> {
  try {
    const snap = await db.collection('usuarios').get();
    const recipients: string[] = [];

    snap.docs.forEach((doc: any) => {
      const u = doc.data();
      const hasMgmtWrite = u.isBishopric || u.role === 'bispado' || u.permissoes?.gerenciamento === 'write' || u.permissoes?.gerenciamento === true;
      if (u.receberNotificacoesCadastro === true && hasMgmtWrite && u.email && u.ativo !== false) {
        recipients.push(u.email.trim());
      }
    });

    // Fallback if no user explicitly has the flag yet: send to bishopric users
    if (recipients.length === 0) {
      snap.docs.forEach((doc: any) => {
        const u = doc.data();
        if ((u.isBishopric || u.role === 'bispado') && u.email && u.ativo !== false) {
          recipients.push(u.email.trim());
        }
      });
    }

    // Fallback to environment variables
    if (recipients.length === 0) {
      if (process.env.ADMIN_EMAILS) {
        process.env.ADMIN_EMAILS.split(',').forEach(e => {
          if (e.trim()) recipients.push(e.trim());
        });
      } else if (process.env.SMTP_USER) {
        recipients.push(process.env.SMTP_USER.trim());
      }
    }

    return Array.from(new Set(recipients));
  } catch (err) {
    console.error('[EmailService] Erro ao consultar destinatários administradores:', err);
    return process.env.SMTP_USER ? [process.env.SMTP_USER.trim()] : [];
  }
}

export async function sendAccessRequestEmail(params: AccessRequestEmailParams): Promise<SendEmailResult> {
  const { adminEmails, solicitanteNome, solicitanteEmail, cargoSolicitado, organizacaoSolicitada, justificativa, dataSolicitacao, gerenciamentoUrl } = params;
  if (!adminEmails || adminEmails.length === 0) {
    return { success: false, simulated: true, error: 'Nenhum administrador configurado para receber notificações.' };
  }

  const transporter = getEmailTransporter();
  const from = getFromAddress();
  const toList = adminEmails.join(', ');
  const subject = `[Ala Bosque] Nova Solicitação de Acesso: ${solicitanteNome}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .hdr { background: #24477a; color: #ffffff; padding: 24px 28px; }
    .hdr h2 { margin: 0 0 6px 0; font-size: 20px; font-weight: 600; }
    .hdr p { margin: 0; font-size: 13px; color: #cbd5e1; }
    .body { padding: 28px; }
    .info-box { background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13.5px; }
    .info-label { color: #64748b; font-weight: 600; }
    .info-val { color: #0f172a; font-weight: 700; }
    .btn { display: inline-block; background: #24477a; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center; margin-top: 10px; }
    .foot { text-align: center; padding: 18px 28px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="hdr">
      <h2>Ala Bosque · Solicitação de Acesso</h2>
      <p>Um novo líder cadastrou-se e está aguardando liberação de permissões.</p>
    </div>
    <div class="body">
      <p style="margin-top: 0; font-size: 14px;">Olá, Administrador(a),</p>
      <p style="font-size: 14px; color: #334155;">
        O usuário <strong>${escapeHtml(solicitanteNome)}</strong> criou uma conta na plataforma da Ala Bosque e solicitou acesso aos módulos do sistema.
      </p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Nome:</span>
          <span class="info-val">${escapeHtml(solicitanteNome)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">E-mail:</span>
          <span class="info-val">${escapeHtml(solicitanteEmail)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Chamado Informado:</span>
          <span class="info-val">${escapeHtml(cargoSolicitado || 'Não informado')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Organização:</span>
          <span class="info-val">${escapeHtml(organizacaoSolicitada || 'Não informada')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data do Pedido:</span>
          <span class="info-val">${escapeHtml(dataSolicitacao)}</span>
        </div>
        ${justificativa ? `
        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 13px;">
          <strong style="color: #64748b;">Mensagem do Solicitante:</strong><br>
          <em>"${escapeHtml(justificativa)}"</em>
        </div>` : ''}
      </div>

      <p style="font-size: 13.5px; color: #475569;">
        Por padrão, novos usuários são criados sem nenhuma permissão de acesso. Você pode definir os níveis de leitura e escrita do usuário ou aplicar um preset na <strong>Central de Gerenciamento</strong>.
      </p>

      <div style="text-align: center; margin: 24px 0 10px 0;">
        <a href="${escapeHtml(gerenciamentoUrl)}" class="btn" target="_blank">
          Analisar e Liberar Acesso na Central
        </a>
      </div>
    </div>
    <div class="foot">
      Este e-mail foi enviado automaticamente porque você está configurado para receber notificações de novos cadastros na Ala Bosque.
    </div>
  </div>
</body>
</html>
  `.trim();

  const textContent = `
[Ala Bosque - Nova Solicitação de Acesso]
Nome: ${solicitanteNome}
E-mail: ${solicitanteEmail}
Chamado: ${cargoSolicitado || 'Não informado'}
Organização: ${organizacaoSolicitada || 'Não informada'}
Data: ${dataSolicitacao}
${justificativa ? `Mensagem: ${justificativa}\n` : ''}

Acesse a Central de Gerenciamento para liberar as permissões:
${gerenciamentoUrl}
  `.trim();

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[SIMULAÇÃO DE E-MAIL - NOTIFICAÇÃO DE NOVO CADASTRO]`);
    console.log(`Para: ${toList}`);
    console.log(`Assunto: ${subject}`);
    console.log(`Solicitante: ${solicitanteNome} (${solicitanteEmail})`);
    console.log(`Chamado: ${cargoSolicitado || 'Não informado'} / ${organizacaoSolicitada || '—'}`);
    console.log(`Link: ${gerenciamentoUrl}`);
    console.log(`======================================================\n`);
    return {
      success: true,
      simulated: true,
      messageId: `sim-${Date.now()}`,
    };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: toList,
      subject,
      text: textContent,
      html: htmlContent,
    });
    console.log(`[EmailService] E-mail de solicitação de acesso enviado com sucesso para ${toList}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[EmailService] Erro ao enviar e-mail de notificação de cadastro para ${toList}:`, error);
    return {
      success: false,
      error: error.message || 'Falha ao enviar mensagem pelo servidor SMTP.',
    };
  }
}


export interface AccessApprovedEmailParams {
  to: string;
  userName: string;
  cargo?: string;
  organizacao?: string;
  appUrl: string;
}

export async function sendAccessApprovedEmail(params: AccessApprovedEmailParams): Promise<SendEmailResult> {
  const { to, userName, cargo, organizacao, appUrl } = params;
  if (!to) {
    return { success: false, error: 'E-mail de destino inválido.' };
  }

  const transporter = getEmailTransporter();
  const from = getFromAddress();
  const subject = '[Ala Bosque] Seu acesso à plataforma foi liberado!';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .hdr { background: #16a34a; color: #ffffff; padding: 24px 28px; }
    .hdr h2 { margin: 0 0 6px 0; font-size: 20px; font-weight: 600; }
    .hdr p { margin: 0; font-size: 13px; color: #dcfce7; }
    .body { padding: 28px; }
    .info-box { background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #bbf7d0; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13.5px; }
    .info-label { color: #166534; font-weight: 600; }
    .info-val { color: #0f172a; font-weight: 700; }
    .btn { display: inline-block; background: #16a34a; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center; margin-top: 10px; }
    .foot { text-align: center; padding: 18px 28px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="hdr">
      <h2>Ala Bosque · Acesso Liberado</h2>
      <p>Suas permissões foram concedidas pelo Bispado e Administradores.</p>
    </div>
    <div class="body">
      <p style="margin-top: 0; font-size: 14px;">Olá, <strong>${escapeHtml(userName)}</strong>,</p>
      <p style="font-size: 14px; color: #334155;">
        O Bispado da Ala Bosque analisou sua solicitação e liberou o seu acesso à plataforma interna. As permissões referentes ao seu chamado foram configuradas com sucesso.
      </p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Usuário:</span>
          <span class="info-val">${escapeHtml(userName)}</span>
        </div>
        ${cargo ? `
        <div class="info-row">
          <span class="info-label">Chamado / Atribuição:</span>
          <span class="info-val">${escapeHtml(cargo)}</span>
        </div>` : ''}
        ${organizacao ? `
        <div class="info-row">
          <span class="info-label">Organização:</span>
          <span class="info-val">${escapeHtml(organizacao)}</span>
        </div>` : ''}
      </div>

      <div style="text-align: center; margin: 24px 0 10px 0;">
        <a href="${escapeHtml(appUrl)}" class="btn" target="_blank">
          Acessar a Plataforma
        </a>
      </div>
    </div>
    <div class="foot">
      Ala Bosque · A Igreja de Jesus Cristo dos Santos dos Últimos Dias
    </div>
  </div>
</body>
</html>
  `.trim();

  const textContent = `
[Ala Bosque - Acesso Liberado]
Olá, ${userName}!

O Bispado da Ala Bosque aprovou seu acesso à plataforma.
Chamado: ${cargo || 'Líder'}
Organização: ${organizacao || '—'}

Acesse agora:
${appUrl}
  `.trim();

  if (!transporter) {
    console.log('\n======================================================');
    console.log('[SIMULAÇÃO DE E-MAIL - ACESSO LIBERADO]');
    console.log('Para: ' + to);
    console.log('Assunto: ' + subject);
    console.log('Usuário: ' + userName);
    console.log('Link: ' + appUrl);
    console.log('======================================================\n');
    return {
      success: true,
      simulated: true,
      messageId: 'sim-' + Date.now(),
    };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });
    console.log('[EmailService] E-mail de liberação de acesso enviado com sucesso para ' + to + '. MessageId: ' + info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[EmailService] Erro ao enviar e-mail de liberação para ' + to + ':', error);
    return {
      success: false,
      error: error.message || 'Falha ao enviar mensagem pelo servidor SMTP.',
    };
  }
}
