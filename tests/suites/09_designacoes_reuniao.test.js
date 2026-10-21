import { By, until } from 'selenium-webdriver';
import { CONFIG } from '../config.js';
import { loginAsBispado, takeScreenshot } from '../driver.js';

export function registerDesignacoesReuniaoTests(runner) {
  runner.suite('Designações Integradas e Pauta Viva de Reunião', (s) => {
    s.beforeAll(async (driver) => {
      await loginAsBispado(driver);
    });

    s.test('Página /designacoes exibe seletor inteligente de membros com datalist e atalhos', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/designacoes`);
      const h2 = await driver.wait(until.elementLocated(By.css('h2')), CONFIG.timeout);
      const text = await h2.getText();
      if (!text.includes('Designações')) {
        throw new Error(`Esperado título com "Designações", obteve: "${text}"`);
      }

      // Open new modal
      const newBtn = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(text(), '+ Nova designação')]")),
        CONFIG.timeout
      );
      await newBtn.click();

      // Check for member datalist and preset role chips
      await driver.wait(until.elementLocated(By.css('#membros-designacao-list')), CONFIG.timeout);
      const chips = await driver.findElements(By.css('.modal .chip'));
      if (chips.length === 0) {
        throw new Error('Nenhum chip de atalho rápido de liderança encontrado no modal de designação');
      }

      // Close modal
      const cancelBtn = await driver.findElement(By.css('.modal .btn.ghost'));
      await cancelBtn.click();
      await driver.sleep(200);
    });

    s.test('Página /reuniao exibe widgets dinâmicos interativos na pauta viva', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/reuniao`);
      await driver.sleep(300);

      // Check if a meeting is already active, otherwise start one
      const activeHeader = await driver.findElements(By.css('.mhead h2'));
      if (activeHeader.length === 0) {
        const startBtn = await driver.wait(
          until.elementLocated(By.xpath("//button[contains(text(), 'Iniciar reunião de bispado') or contains(text(), 'Iniciar conselho')]")),
          CONFIG.timeout
        );
        await startBtn.click();
        await driver.sleep(400);
      }

      // Find section B (Designações anteriores)
      const secHeaders = await driver.wait(
        until.elementsLocated(By.css('.sec-h')),
        CONFIG.timeout
      );

      let secB = null;
      for (const sh of secHeaders) {
        const txt = await sh.getText();
        if (txt.includes('Designações anteriores')) {
          secB = sh;
          break;
        }
      }

      if (secB) {
        await secB.click();
        await driver.sleep(300);

        // Verify live task embed widget is present
        const embedWidget = await driver.wait(
          until.elementLocated(By.css('.embed')),
          CONFIG.timeout
        );
        const embedText = (await embedWidget.getText()).toLowerCase();
        if (!embedText.includes('designações') && !embedText.includes('em dia')) {
          throw new Error(`Widget dinâmico de designações anteriores não exibiu conteúdo esperado: ${embedText}`);
        }

        // Verify + Designação button opens modal right in the meeting
        const addBtn = await driver.findElement(By.xpath("//button[contains(text(), '+ Designação') or contains(text(), '+ Nova designação')]"));
        await addBtn.click();

        await driver.wait(
          until.elementLocated(By.xpath("//h3[contains(text(), 'Nova Designação na Reunião')]")),
          CONFIG.timeout
        );

        await takeScreenshot(driver, 'reuniao_widgets_pass');

        // Cancel modal
        const cancelBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Cancelar')]"));
        await cancelBtn.click();
        await driver.sleep(200);
      }
    });
  });
}
