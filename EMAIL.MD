# 📧 Configuração do Servidor de E-mail (SMTP) - Bispado Ala Bosque

Este documento descreve como configurar o envio automático de e-mails do sistema para notificações de **Tickets / Solicitações de Atividades** (Aprovações, Pedidos de Ajustes e Reprovações com justificativa).

---

## 📌 Como funciona o fluxo de e-mails

1. **Solicitação Criada**:
   - O solicitante (usuário autenticado) cria um ticket de atividade.
   - O sistema registra o solicitante com seu nome, e-mail e cargo.

2. **Decisão do Bispado**:
   - **Aprovada**: O solicitante recebe um e-mail com a confirmação, data reservada e orientações do bispado.
   - **Alterações Solicitadas (Pedir Ajustes)**: O solicitante recebe um e-mail contendo as instruções do que precisa ser alterado e o aviso para editar e reenviar o ticket no sistema.
   - **Não Aprovada (Reprovada / Negada)**: O solicitante recebe um e-mail detalhado com a justificativa e o motivo informado pelo bispado.

> **Nota:** Se as variáveis de SMTP não estiverem configuradas, o sistema continua funcionando normalmente e exibe uma simulação formatada no terminal/logs do servidor, sem gerar erros para o usuário.

---

## ⚙️ Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis no arquivo `.env` do backend (local) ou no painel de **Environment** do serviço no Render:

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `SMTP_HOST` | Endereço do servidor SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Porta de conexão | `587` (ou `465` para SSL) |
| `SMTP_SECURE` | Conexão segura SSL direta | `false` (para 587) ou `true` (para 465) |
| `SMTP_USER` | E-mail / usuário da conta SMTP | `bispado.alabosque@gmail.com` |
| `SMTP_PASS` | Senha de Aplicativo ou chave de API | `xxxx xxxx xxxx xxxx` |
| `SMTP_FROM` | Nome e e-mail que aparecem no remetente | `"Bispado Ala Bosque" <bispado.alabosque@gmail.com>` |

---

## 🚀 Provedores Recomendados e Passo a Passo

### Opção 1: Gmail (Recomendado para uso inicial gratuito)

O Gmail não aceita mais a senha comum da conta para conexões externas. É necessário gerar uma **Senha de Aplicativo (App Password)**:

1. Acesse sua conta Google (ex: a conta oficial do Bispado): [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Ative a **Verificação em duas etapas** (se ainda não estiver ativa).
3. Na barra de busca da Conta Google, digite **"Senhas de app"** (ou acesse a seção de segurança).
4. Crie uma nova senha de app com o nome `Bispado Ala Bosque`.
5. O Google gerará um código de 16 letras (ex: `abcd efgh ijkl mnop`).
6. Configure as variáveis:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=seu.email.bispado@gmail.com
   SMTP_PASS=abcdefghijklmnop
   SMTP_FROM="Bispado Ala Bosque" <seu.email.bispado@gmail.com>
   ```

---

### Opção 2: Outlook / Microsoft 365 / Hotmail

1. Se a conta tiver verificação em 2 etapas, gere uma **Senha de Aplicativo** nas configurações de segurança da conta Microsoft.
2. Configure as variáveis:
   ```env
   SMTP_HOST=smtp.office365.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=seu.email@outlook.com
   SMTP_PASS=sua_senha_de_app
   SMTP_FROM="Bispado Ala Bosque" <seu.email@outlook.com>
   ```

---

### Opção 3: Resend (Serviço profissional moderno - 3.000 e-mails/mês grátis)

O [Resend](https://resend.com) é um dos serviços de e-mail transacionais mais confiáveis para hospedagem na nuvem:

1. Crie uma conta gratuita em [resend.com](https://resend.com).
2. Vá em **API Keys** e crie uma nova chave.
3. Configure as variáveis:
   ```env
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=resend
   SMTP_PASS=re_123456789_sua_api_key
   SMTP_FROM="Bispado Ala Bosque" <onboarding@resend.dev>
   ```
   *(Ou com o domínio próprio configurado no Resend).*

---

### Opção 4: SendGrid

1. Crie uma API Key no [SendGrid](https://sendgrid.com) com permissões de envio de e-mail.
2. Configure as variáveis:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASS=SG.sua_chave_completa
   SMTP_FROM="Bispado Ala Bosque" <seu_email_verificado@dominio.com>
   ```

---

## 🌐 Como Configurar no Render (Produção)

1. Acesse o [Dashboard do Render](https://dashboard.render.com).
2. Clique no serviço do seu **Backend** (`bispado-backend`).
3. No menu lateral esquerdo, clique em **Environment**.
4. Clique em **Add Environment Variable** e adicione as variáveis:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`
5. Clique em **Save Changes**. O Render fará o redeploy automático com o envio de e-mails ativo!

---

## 🔍 Como Testar o Envio

1. Acesse o sistema e entre na tela **Atividades**.
2. Clique em **+ Nova solicitação de atividade** e envie uma atividade de teste.
3. Com o usuário do Bispado, clique na atividade e escolha **Pedir alterações** ou **Não aprovar** informando um motivo.
4. Verifique a caixa de entrada (e a caixa de spam) do e-mail do solicitante.
5. Se o SMTP estiver correto, o e-mail chegará com o cabeçalho estilizado do Bispado e o motivo descrito com destaque.
