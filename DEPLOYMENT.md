# Guia Completo de Instalação, Configuração e Implantação
## Sistema de Gestão do Bispado e Conselho da Ala (Ala Bosque)

Este projeto é uma reconstrução completa do artefato `Bispado.html` em uma arquitetura moderna e escalável:
- **Frontend**: Single Page Application em React 18 + TypeScript + Vite.
- **Backend**: API RESTful em TypeScript + Express.
- **Banco de Dados & Autenticação**: Google Firebase (Firestore Database + Firebase Authentication via Firebase Admin SDK).
- **Contêineres**: Docker & Docker Compose com Nginx como proxy reverso de produção.

---

## 1. Arquitetura do Sistema

```
┌──────────────────────────────────────────────────────────┐
│                      Navegador Web                       │
│    React 18 SPA (Interface idêntica ao Bispado.html)     │
└────────────────────────────┬─────────────────────────────┘
                             │ Chamadas HTTP REST
                             │ Header: Authorization: Bearer <token>
                             ▼
┌──────────────────────────────────────────────────────────┐
│               Servidor Express (TypeScript)              │
│  - Middleware de Autenticação (Firebase Admin SDK)       │
│  - Guard de Confidencialidade (requireBishopric)         │
│  - Regras de Negócio e Validações de Domínio            │
└────────────────────────────┬─────────────────────────────┘
                             │ Conexão Segura Admin
                             ▼
┌──────────────────────────────────────────────────────────┐
│                     Google Firebase                      │
│  - Cloud Firestore:                                      │
│      • Coleções Gerais: /designacoes, /reunioes, etc.    │
│      • Coleções Confidenciais: /conf/b/* (Pessoas, etc.) │
│  - Firebase Authentication: Gestão de Sessões e Tokens   │
└──────────────────────────────────────────────────────────┘
```

### Confidencialidade e Níveis de Acesso
Em conformidade com as diretrizes do **Manual Geral da Igreja**, os dados são estritamente segregados entre:
1. **Conselho da Ala (`conselho`)**: Acesso a Visão Geral, Designações do Conselho, Pauta da Reunião de Conselho, Agenda, Atividades e Festas.
2. **Bispado (`bispado`)**: Acesso irrestrito a todas as abas, incluindo as pastas confidenciais `/conf/b/*` (Pipeline de Pessoas e Apoio, Lista de Membros em lotes de 250, Histórico de Chamados, Finanças e Prestação de Contas, Indicadores e Atas do Bispado).

---

## 2. Configuração do Firebase

### Passo 1: Criar o Projeto no Firebase Console
1. Acesse o [Firebase Console](https://console.firebase.google.com/) com sua Conta Google.
2. Clique em **Adicionar projeto** e nomeie (ex.: `ala-bosque-gestao`).
3. Desative o Google Analytics (opcional) e crie o projeto.

### Passo 2: Ativar o Cloud Firestore
1. No menu lateral, acesse **Build > Firestore Database**.
2. Clique em **Criar banco de dados**.
3. Selecione o modo de regras (**Modo de Produção**).
4. Escolha a região mais próxima (ex.: `southamerica-east1` em São Paulo).

### Passo 3: Ativar o Firebase Authentication
1. No menu lateral, acesse **Build > Authentication**.
2. Clique em **Começar**.
3. Na aba **Método de login (Sign-in method)**:
   - Ative o provedor **E-mail/senha**.
   - Ative o provedor **Google**: clique em Google, selecione o e-mail de suporte do projeto e clique em **Salvar**.
4. (Opcional) Na aba **Settings > Authorized domains**, verifique se `localhost` e seu domínio de produção estão listados para o popup do Google funcionar sem bloqueios.

### Passo 4: Gerar a Chave da Conta de Serviço (Backend)
1. No Firebase Console, clique no ícone de engrenagem ⚙️ (ao lado de Visão geral do projeto) > **Configurações do projeto**.
2. Acesse a aba **Contas de serviço**.
3. Clique no botão **Gerar nova chave privada** e confirme clicando em **Gerar chave**.
4. O arquivo JSON será baixado. Renomeie-o para `service-account.json` e coloque-o na pasta `backend/` (ou armazene o conteúdo dele em variável de ambiente).

### Passo 5: Obter Credenciais Web (Frontend)
1. Na aba **Geral** das Configurações do projeto, role até **Seus aplicativos** e clique no ícone **Web (`</>`)**.
2. Dê um apelido (ex.: `Bispado Web`) e registre o app.
3. Copie as chaves do objeto `firebaseConfig` (`apiKey`, `authDomain`, `projectId`, etc.) para o arquivo `.env` do frontend.

---

## 3. Executando Localmente (Desenvolvimento)

O projeto possui um modo de fallback de desenvolvimento (`MockFirestore` e seletor rápido de perfil Bispado/Conselho). Você pode testar e rodar o projeto imediatamente, mesmo antes de conectar suas credenciais oficiais do Firebase.

### Pré-requisitos
- Node.js versão 18 ou superior.
- Git.

### 1. Inicializar o Backend
```bash
cd backend
npm install
npm run dev
```
O servidor estará rodando em `http://localhost:4000`.

### 2. Inicializar o Frontend
Abra outro terminal:
```bash
cd frontend
npm install
npm run dev
```
O frontend estará acessível em `http://localhost:5173`.

### 3. Carga Inicial de Dados (Seed)
Com o sistema aberto, vá na aba **Importar Dados** e clique no botão **"Executar Carga Inicial de Dados"** para popular automaticamente as organizações (Bispado, Quórum de Élderes, Sociedade de Socorro, Primária, etc.), lista inicial de cargos e orçamento base.

---

## 4. Implantação com Docker e Docker Compose (Recomendado)

O repositório inclui configuração completa do Docker com:
- Multi-stage build para otimização de imagens Alpine.
- Frontend servido em Nginx com compressão gzip e cache estático.
- Nginx configurado para rotear automaticamente chamadas `/api/*` diretamente para o contêiner Express.

### Passo 1: Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto (baseado em `.env.example`):
```bash
cp .env.example .env
```
Preencha com o `FIREBASE_PROJECT_ID` e coloque o arquivo `service-account.json` dentro da pasta `backend/`.

### Passo 2: Construir e Subir os Contêineres
Na raiz do projeto:
```bash
docker compose up -d --build
```

### Passo 3: Verificar Status
```bash
docker compose ps
docker compose logs -f
```
A aplicação estará disponível em:
- **Interface Web**: `http://SEU_IP_OU_DOMINIO:8080`
- **API Express**: `http://SEU_IP_OU_DOMINIO:4000`

---

## 5. Implantação em Servidor VPS (Ubuntu / Debian na Nuvem)

Se você utiliza uma VPS (DigitalOcean, AWS EC2, Contabo, Linode, Hetzner, etc.):

### 1. Instalar Docker na VPS
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. Clonar o Projeto e Subir
```bash
git clone <URL_DO_SEU_REPOSITORIO> lcr-bispado
cd lcr-bispado
# Configure o .env e backend/service-account.json
docker compose up -d --build
```

### 3. Configurar Domínio e SSL Grátis (Nginx Host + Certbot)
Para acessar com domínio seguro HTTPS (ex.: `bispado.suaala.org`):

Instale o Nginx no servidor host:
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

Crie o arquivo `/etc/nginx/sites-available/bispado`:
```nginx
server {
    server_name bispado.suaala.org;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ative o site e gere o certificado SSL gratuito:
```bash
sudo ln -s /etc/nginx/sites-available/bispado /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d bispado.suaala.org
```

---

## 6. Configuração de Regras de Segurança no Firestore

No console do Firebase, defina as regras para proteger os documentos caso ocorra qualquer leitura direta no cliente:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Todas as leituras e gravações passam pela API Express com o Firebase Admin SDK
    // As regras abaixo bloqueiam chamadas diretas não autorizadas no Firestore client-side:
    match /conf/b/{document=**} {
      allow read, write: if request.auth != null && request.auth.token.role == 'bispado';
    }
    
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.canWrite == true;
    }
  }
}
```

---

## 7. Atribuindo a Função de Bispado aos Usuários

Para marcar um usuário do Firebase Auth como membro do Bispado (Custom Claims), você pode rodar o comando Node diretamente no backend ou executar este script via terminal:

```typescript
import admin from 'firebase-admin';

// Definir claims personalizadas para o e-mail do Bispo
async function setBishopRole(uid: string) {
  await admin.auth().setCustomUserClaims(uid, {
    role: 'bispado',
    isBishopric: true,
    canWrite: true
  });
  console.log(`Função de Bispado concedida com sucesso ao usuário: ${uid}`);
}
```

---

## 8. Manutenção e Rotina de Backup

- **Backup do Firestore**: Recomendado ativar a exportação diária agendada do Cloud Firestore para um bucket do Cloud Storage via Cloud Function ou Cloud Scheduler:
  ```bash
  gcloud firestore export gs://seu-bucket-backup-bispado
  ```
- **Exportação de Membros e Finanças**: O sistema oferece botões nativos para exportar CSV a qualquer momento nas abas **Membros** e **Financeiro**.
