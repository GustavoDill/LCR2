import { By, until } from 'selenium-webdriver';
import { CONFIG } from '../config.js';
import { loginAsBispado, takeScreenshot } from '../driver.js';

export function registerFinanceiroTests(runner) {
  runner.suite('Financeiro e Orçamento', (s) => {
    s.beforeAll(async (driver) => {
      await loginAsBispado(driver);
    });

    s.test('Carrega página /financeiro com cabeçalho', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/financeiro`);
      const h2 = await driver.wait(until.elementLocated(By.css('h2')), CONFIG.timeout);
      const text = await h2.getText();
      if (!text.includes('Financeiro')) {
        throw new Error(`Esperado título com "Financeiro", obteve: "${text}"`);
      }
    });

    s.test('Exibe resumo orçamentário e linhas de orçamento', async (driver) => {
      const pageText = await driver.findElement(By.css('body')).getText();
      if (!pageText.includes('Recebido') && !pageText.includes('Gasto') && !pageText.includes('Saldo') && !pageText.includes('Orçamento')) {
        throw new Error('Estatísticas essenciais de financeiro não encontradas');
      }

      await takeScreenshot(driver, 'financeiro_pass');
    });
  });
}
