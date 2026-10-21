---
name: lcr2-e2e-testing
description: Execute, debug, and extend the Selenium E2E automated test suite for the LCR2 application to validate UI screens, authentication, data accuracy, and user interactions. Use this skill whenever testing features, validating regressions, verifying bug fixes, or adding validation for new and future features.
---

# LCR2 Selenium E2E Testing Skill

This skill provides step-by-step procedures, commands, conventions, and examples for testing the **LCR2 (Ala Bosque)** web application using the Selenium WebDriver E2E suite.

---

## 1. Environment & Prerequisites

Before running tests, ensure the local development servers are running:
- **Frontend**: `http://localhost:5173` (Vite / React)
- **Backend**: `http://localhost:5000` (Node / Express / Firestore)
- **Node.js**: v20+ with native ES modules (`"type": "module"` in root `package.json`)
- **Browser**: Google Chrome installed on the host system (`C:\Program Files\Google\Chrome\Application\chrome.exe`)

---

## 2. Test Execution Commands

From the workspace root (`c:\Users\Gustavo\Desktop\LCR2`):

### Run All Tests (Headless)
Runs all test suites fast in the background:
```bash
npm test
# ou
node tests/run.js
```

### Run Tests in Headed Mode (Visible Chrome Window)
Launches a visible Chrome window to watch the test execution live:
```bash
npm run test:headed
# ou
node tests/run.js --headed
```

### Run a Specific Test Suite
Filter by suite name (case-insensitive substring match):
```bash
node tests/run.js --suite=indicadores
node tests/run.js --suite=seminario
node tests/run.js --suite=chamados
node tests/run.js --suite=membros
node tests/run.js --suite=atividades
node tests/run.js --suite=financeiro
node tests/run.js --suite=agenda
node tests/run.js --suite=auth
```

### Run a Single Test / Filter by Keyword
Filter by test description keyword:
```bash
node tests/run.js --filter="ranking"
node tests/run.js --filter="Sacramental"
node tests/run.js --filter="modal"
```

---

## 3. Suite Architecture

```
tests/
├── config.js               # Central config (URLs, timeouts, window dimensions, paths)
├── driver.js               # Driver factory, auth helpers, screenshot utilities
├── runner.js               # Modular runner engine (suite, test, beforeAll, afterAll)
├── run.js                  # CLI entrypoint registering all suites
├── README.md               # Quick start documentation
├── artifacts/              # Failure screenshots and test dumps (.gitignored)
└── suites/
    ├── 01_auth.test.js        # Login, mock sessions, protected routes
    ├── 02_indicadores.test.js # Ala health metrics, SAC 150, 6-month history table
    ├── 03_seminario.test.js   # Seminário & Instituto cards, 6º/7 ranking, 14 students
    ├── 04_chamados.test.js    # Calling list, modal, (Nenhum) option, search
    ├── 05_membros.test.js     # Members directory, statistics, search
    ├── 06_atividades.test.js  # Activities Kanban, tabs, proposal modal
    ├── 07_financeiro.test.js  # Budget overview, expenses, org balance
    └── 08_agenda.test.js      # Calendar views and events
```

---

## 4. Key Helpers in `tests/driver.js`

- **`loginAsBispado(driver)`**: Navigates to `/login`, clicks "Simular Bispado", sets persistent `lcr2_dev_user` in `localStorage`, and waits for layout render.
- **`loginAsConselho(driver)`**: Logs in as leadership/council member.
- **`logout(driver)`**: Clears session and returns to login.
- **`takeScreenshot(driver, filename)`**: Saves a `.png` into `tests/artifacts/screenshots/`.
- **`waitForElement(driver, locator, timeout)`**: Explicit wait until element is located in DOM.
- **`safeGetText(driver, locator, timeout)`**: Waits for element and extracts trimmed inner text.

---

## 5. How to Validate Screens and Data

When writing assertions for UI data:

1. **Verify Numbers & Calculations**:
   ```javascript
   const sacText = await safeGetText(driver, By.css('.icell:nth-child(1) .ival'));
   if (!sacText.includes('150')) {
     throw new Error(`Esperado valor 150 na Sacramental, obteve: "${sacText}"`);
   }
   ```

2. **Verify Multi-line Text**:
   Normalize whitespace when verifying cards with nested spans or newlines:
   ```javascript
   const cardText = (await cardEl.getText()).replace(/\s+/g, ' ');
   if (!cardText.includes('8 matriculados') || !cardText.includes('6º de 7')) {
     throw new Error(`Texto do card não corresponde: "${cardText}"`);
   }
   ```

3. **Verify Interactive Elements & Modals**:
   ```javascript
   const openBtn = await driver.findElement(By.css('.btn-action'));
   await openBtn.click();
   const modal = await driver.wait(until.elementLocated(By.css('.modal')), CONFIG.timeout);
   const isVisible = await modal.isDisplayed();
   if (!isVisible) throw new Error('Modal não apareceu');
   ```

---

## 6. How to Add a Test Suite for a New/Future Feature

When creating a new feature (e.g. `Relatórios`, `Missionários`, `Limpeza da Capela`):

1. **Create the test file** in `tests/suites/`:
   ```javascript
   // tests/suites/09_missionarios.test.js
   import { By, until } from 'selenium-webdriver';
   import { CONFIG } from '../config.js';
   import { loginAsBispado, takeScreenshot } from '../driver.js';

   export function registerMissionariosTests(runner) {
     runner.suite('Missionários da Ala', (s) => {
       s.beforeAll(async (driver) => {
         await loginAsBispado(driver);
       });

       s.test('Carrega página /missionarios com tabela e contadores', async (driver) => {
         await driver.get(`${CONFIG.baseUrl}/missionarios`);
         const heading = await driver.wait(
           until.elementLocated(By.css('h1, .page-title')),
           CONFIG.timeout
         );
         const text = await heading.getText();
         if (!text.includes('Missionários')) {
           throw new Error(`Esperado título "Missionários", obteve: "${text}"`);
         }
       });

       s.test('Permite adicionar novo missionário via formulário', async (driver) => {
         // Interação e validação de tela e dados...
       });
     });
   }
   ```

2. **Register in `tests/run.js`**:
   ```javascript
   import { registerMissionariosTests } from './suites/09_missionarios.test.js';
   registerMissionariosTests(runner);
   ```

3. **Optionally add npm script** in `package.json`:
   ```json
   "test:missionarios": "node tests/run.js --suite=missionarios"
   ```

4. **Run and Verify**:
   ```bash
   node tests/run.js --suite=missionarios
   ```

---

## 7. Troubleshooting & Best Practices

- **Timeout waiting for element**: Verify if the component is waiting for a backend API call. Check dev server console or increase `CONFIG.timeout`.
- **Selector matches wrong element**: Prefer specific class names (e.g. `.atv-title`) over generic tags (`h1`, `h2`) which may match the global sidebar/header.
- **Session drops on navigation**: Ensure `localStorage.getItem('lcr2_dev_user')` is respected in `AuthContext.tsx`.
- **Visual inspection**: If an assertion fails, check the automatic screenshot in `tests/artifacts/screenshots/FAIL_<suite>_<test>.png` to see what was rendered on screen.
