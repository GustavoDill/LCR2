# 🧪 Suíte de Testes Automatizados E2E (Selenium) - LCR2

Esta suíte de testes de ponta a ponta (E2E) foi desenvolvida para validar todos os módulos existentes do sistema **LCR2 (Ala Bosque)** e fornecer uma infraestrutura extensível para recursos futuros.

---

## 🎯 Cobertura Atual dos Testes (30 Testes E2E)

1. **`01_auth.test.js`** (4 testes):
   - Carregamento da página de Login e elementos de acesso rápido
   - Fluxo de login como Bispado com persistência de sessão dev
   - Proteção de rotas privadas (redirecionamento de usuários desautenticados)
   - Permissões completas de visualização e edição

2. **`02_indicadores.test.js`** (6 testes):
   - Cabeçalho autêntico do Painel de Saúde da Ala
   - Seletor de mês dinâmico ("outubro 2026")
   - Renderização dos 11 cartões de indicadores essenciais
   - Validação da métrica da Reunião Sacramental (150 participantes)
   - Tabela comparativa histórica dos últimos 6 meses com sparklines
   - Navegação temporal entre meses retroativos e futuros

3. **`03_seminario.test.js`** (6 testes):
   - Dashboard de Seminário e Instituto (S&I)
   - Card do Seminário: métricas (8/57, 14%, 24,2% estaca) e ranking da estaca (**6º de 7**)
   - Card do Instituto: métricas (8/167, 4,8%, 4,5% estaca) e ranking da estaca (**4º de 7**)
   - Métricas de Alunos: 14 alunos, 0 com crédito, 5 com pendência, 9 em risco
   - Tabela de alunos com badges coloridos e barras de frequência percentual
   - Filtros rápidos em chips (Seminário, Instituto, Em risco, Pendência, Com crédito)

4. **`04_chamados.test.js`** (4 testes):
   - Grid de organizações e cargos eclesiásticos
   - Abertura de modal de preenchimento/troca de chamado
   - Presença da opção `(Nenhum)` no topo do seletor para vagas abertas
   - Campo de busca instantânea para seleção de membros

5. **`05_membros.test.js`** (3 testes):
   - Diretório de membros com cards estatísticos
   - Renderização da listagem de membros importados
   - Filtro e busca textual por nome em tempo real

6. **`06_atividades.test.js`** (3 testes):
   - Painel Kanban/Lista de atividades da ala
   - Contadores de status (Aguardando aprovação, Aprovadas, Ajustes, Custo)
   - Modal de proposta de nova atividade com validação de campos

7. **`07_financeiro.test.js`** (2 testes):
   - Balanço e resumo orçamentário da ala
   - Linhas de orçamento por organização

8. **`08_agenda.test.js`** (2 testes):
   - Calendário da ala e visualização de eventos programados
   - Integração das atividades aprovadas na agenda

---

## 🚀 Como Executar

Certifique-se de que o backend (porta 5000) e o frontend (porta 5173) estejam em execução.

### Executar todos os testes (Headless - rápido em segundo plano):
```bash
npm test
# ou
node tests/run.js
```

### Executar visualizando o navegador Chrome na tela:
```bash
npm run test:headed
# ou
node tests/run.js --headed
```

### Executar uma suíte específica:
```bash
# Apenas a suíte de Indicadores
npm run test:indicadores

# Apenas a suíte de Seminário
npm run test:seminario

# Apenas a suíte de Chamados
npm run test:chamados

# Ou qualquer termo via linha de comando:
node tests/run.js --suite=auth
node tests/run.js --suite=atividades
```

### Filtrar por teste individual:
```bash
node tests/run.js --filter="ranking"
node tests/run.js --filter="Sacramental"
```

---

## 🏗️ Como Adicionar Testes para Novas Features Futuras

A arquitetura foi desenhada no padrão plug-and-play modular:

1. Crie um novo arquivo de teste dentro de `tests/suites/`, por exemplo `09_minha_feature.test.js`:

```javascript
import { By, until } from 'selenium-webdriver';
import { CONFIG } from '../config.js';
import { loginAsBispado, takeScreenshot } from '../driver.js';

export function registerMinhaFeatureTests(runner) {
  runner.suite('Minha Nova Feature', (s) => {
    s.beforeAll(async (driver) => {
      await loginAsBispado(driver);
    });

    s.test('Minha Feature carrega corretamente', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/minha-rota`);
      const elemento = await driver.wait(
        until.elementLocated(By.css('.meu-componente')),
        CONFIG.timeout
      );
      if (!elemento) throw new Error('Elemento não encontrado');
    });
  });
}
```

2. Registre a nova função no arquivo central `tests/run.js`:
```javascript
import { registerMinhaFeatureTests } from './suites/09_minha_feature.test.js';

registerMinhaFeatureTests(runner);
```

Pronto! Ao executar `npm test`, a nova feature será automaticamente validada junto com as demais.
Se qualquer teste falhar, um screenshot do momento exato do erro será gerado automaticamente em `tests/artifacts/screenshots/`.
