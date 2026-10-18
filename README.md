# LCR2 - Portal de Gestão do Bispado e Conselho da Ala

Reconstrução e evolução do artefato `Bispado.html` para uma aplicação web completa com **Express + TypeScript** no backend e **React + TypeScript + Vite** no frontend, com persistência e autenticação via **Google Firebase** (Cloud Firestore e Firebase Auth).

---

## 🚀 Estrutura do Repositório

- **[`backend/`](file:///c:/Users/gustavo.dill/Desktop/LCR2/backend)**: Servidor Node.js Express em TypeScript com Firebase Admin SDK, rotas de CRUD completas, verificação de tokens e proteção para rotas confidenciais do bispado (`requireBishopric`).
- **[`frontend/`](file:///c:/Users/gustavo.dill/Desktop/LCR2/frontend)**: Single Page Application (SPA) em React 18, Vite e TypeScript com o design visual completo do `Bispado.html` (cores, modo escuro/claro, badges dinâmicos, pauta com cronômetro e salvamento automático por debounce, pipeline de chamados/desobrigações, diretório com chunking de membros, balanço financeiro e planejamento de Natal).
- **[`docker-compose.yml`](file:///c:/Users/gustavo.dill/Desktop/LCR2/docker-compose.yml)**: Orquestração de contêineres para backend (Express) e frontend (Nginx com proxy reverso).
- **[`DEPLOYMENT.md`](file:///c:/Users/gustavo.dill/Desktop/LCR2/DEPLOYMENT.md)**: Guia passo a passo de implantação em VPS com Docker Compose, configuração de chaves do Firebase e certificado SSL gratuito via Let's Encrypt.

---

## ⚡ Início Rápido (Desenvolvimento Local)

### 1. Iniciar o Backend
```bash
cd backend
npm install
npm run dev
```
O servidor Express estará ativo em `http://localhost:4000`.

### 2. Iniciar o Frontend
Em outro terminal:
```bash
cd frontend
npm install
npm run dev
```
A interface web estará disponível em `http://localhost:5173`.

> **Nota:** O sistema inclui um modo de desenvolvimento com `MockFirestore` e seletor rápido de papel (Bispado / Conselho), permitindo testar todas as funcionalidades imediatamente sem exigir credenciais ativas do Firebase de início.

---

## 🐳 Executando com Docker

```bash
docker compose up -d --build
```
Acesse a aplicação em `http://localhost:8080`.

Para detalhes completos de configuração do Firebase e publicação em nuvem, consulte o [**Guia de Implantação (DEPLOYMENT.md)**](file:///c:/Users/gustavo.dill/Desktop/LCR2/DEPLOYMENT.md).
