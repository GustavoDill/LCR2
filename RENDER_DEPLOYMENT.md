# Guia de Implantação no Render (render.com)
## Portal do Bispado e Conselho da Ala

Este repositório está configurado para implantação no **Render** utilizando o arquivo de blueprint oficial [`render.yaml`](file:///c:/Users/gustavo.dill/Desktop/LCR2/render.yaml), que cria automaticamente:
1. **Web Service (`bispado-backend`)**: Servidor Express em TypeScript conectado ao Firebase Firestore via Admin SDK.
2. **Static Site (`bispado-frontend`)**: Aplicação SPA React 18 + Vite com rewrites automáticos para rotas internas.

---

## Passo a Passo para Implantação

### 1. Subir as alterações para o GitHub
Certifique-se de que o seu repositório no GitHub está atualizado:
```bash
git push origin main
```

### 2. Conectar o Blueprint no Render
1. Acesse o painel do [Render Dashboard](https://dashboard.render.com/).
2. Clique no botão **New +** no canto superior direito e selecione **Blueprint**.
3. Conecte seu repositório do GitHub (`LCR2`).
4. O Render detectará automaticamente o arquivo `render.yaml` e listará os 2 serviços (`bispado-backend` e `bispado-frontend`).

---

### 3. Preencher as Variáveis de Ambiente no Render

Durante a criação do Blueprint (ou na aba **Environment** de cada serviço), preencha os valores solicitados:

#### Para o `bispado-backend` (Web Service):
- **`FIREBASE_PROJECT_ID`**: ID do seu projeto Firebase (ex.: `lcr2-db541`).
- **`FIREBASE_SERVICE_ACCOUNT_JSON`**: Abra o arquivo `serviceAccountKey.json` no seu computador, copie todo o conteúdo JSON (com as quebras de linha e chaves) e cole como valor desta variável.
- **`CORS_ORIGIN`**: Preenchido automaticamente como `*` ou com a URL do seu frontend no Render.

#### Para o `bispado-frontend` (Static Site):
As credenciais do cliente Web do Firebase (obtidas no Firebase Console > Configurações do Projeto > Geral > Seus aplicativos):
- **`VITE_FIREBASE_API_KEY`**: Chave de API pública do Firebase.
- **`VITE_FIREBASE_AUTH_DOMAIN`**: `lcr2-db541.firebaseapp.com`
- **`VITE_FIREBASE_PROJECT_ID`**: `lcr2-db541`
- **`VITE_FIREBASE_STORAGE_BUCKET`**: `lcr2-db541.firebasestorage.app`
- **`VITE_FIREBASE_MESSAGING_SENDER_ID`**: ID do remetente.
- **`VITE_FIREBASE_APP_ID`**: ID do aplicativo web.
- *(Nota: A variável `VITE_API_URL` é vinculada automaticamente pelo Render à URL pública do backend).*

---

### 4. Configurar Domínios Autorizados no Firebase
Após a criação dos serviços no Render:
1. Copie a URL gerada pelo Render para o frontend (ex.: `https://bispado-frontend.onrender.com`).
2. Acesse o [Firebase Console](https://console.firebase.google.com/) > **Authentication** > **Settings** > **Authorized domains**.
3. Clique em **Add domain** e cole o domínio (ex.: `bispado-frontend.onrender.com`).
4. Isso garante que o login com Google e redirecionamentos de autenticação funcionem perfeitamente.

---

### 5. Concluir e Acessar
Clique em **Apply** no Render. O Render compilará ambos os projetos e disponibilizará a URL pública com certificado SSL/HTTPS gratuito automático!
