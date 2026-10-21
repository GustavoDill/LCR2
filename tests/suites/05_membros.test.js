import { By, until } from 'selenium-webdriver';
import { CONFIG } from '../config.js';
import { loginAsBispado, takeScreenshot } from '../driver.js';

export function registerMembrosTests(runner) {
  runner.suite('Diretório de Membros', (s) => {
    s.beforeAll(async (driver) => {
      await loginAsBispado(driver);
    });

    s.test('Carrega página /membros com cabeçalho e estatísticas de membros', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/membros`);
      const h2 = await driver.wait(until.elementLocated(By.css('h2')), CONFIG.timeout);
      const text = await h2.getText();
      if (!text.includes('Membros')) {
        throw new Error(`Esperado título com "Membros", obteve: "${text}"`);
      }
    });

    s.test('Lista de membros é exibida com registros importados', async (driver) => {
      // Find list rows or cards
      const rows = await driver.wait(
        until.elementsLocated(By.css('.list .row, table tbody tr, .card .row')),
        CONFIG.timeout
      );
      if (rows.length === 0) {
        throw new Error('Nenhum membro listado no diretório');
      }
    });

    s.test('Campo de busca de membros filtra por nome', async (driver) => {
      const searchBox = await driver.findElement(By.css("input[type='search'], input[placeholder*='Buscar'], input[placeholder*='buscar']"));
      await searchBox.clear();
      await searchBox.sendKeys('Dill');
      await driver.sleep(300);

      const rows = await driver.findElements(By.css('.list .row, table tbody tr, .card .row'));
      if (rows.length === 0) {
        throw new Error('Nenhum resultado ao buscar por "Dill"');
      }

      const firstText = await rows[0].getText();
      if (!firstText.toLowerCase().includes('dill')) {
        throw new Error(`Primeiro resultado não contém "Dill": ${firstText}`);
      }

      await takeScreenshot(driver, 'membros_pass');
    });
  });
}
