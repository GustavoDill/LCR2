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

    s.test('Exibe badges dinâmicos de chamados ou estado sem chamado nas linhas dos membros', async (driver) => {
      // Clear search to view full list
      const searchBox = await driver.findElement(By.css("input[type='search'], input[placeholder*='Buscar'], input[placeholder*='buscar']"));
      await searchBox.clear();
      await driver.sleep(300);

      const badges = await driver.findElements(By.css('.badge-calling, .badge-sem-chamado'));
      if (badges.length === 0) {
        throw new Error('Nenhum badge de chamado ou status encontrado na listagem de membros');
      }
    });

    s.test('Abre a Ficha 360° do membro em gaveta lateral exibindo perfil integrado', async (driver) => {
      // Find the first Ficha 360 button
      const btn360 = await driver.wait(
        until.elementLocated(By.css('.btn-360, .member-clickable-row')),
        CONFIG.timeout
      );
      await btn360.click();

      // Wait for drawer panel to appear
      const drawer = await driver.wait(
        until.elementLocated(By.css('.drawer-panel')),
        CONFIG.timeout
      );

      // Wait for 360 profile data to load inside drawer
      await driver.wait(
        until.elementLocated(By.css('.drawer-section-title')),
        CONFIG.timeout
      );

      const drawerText = (await drawer.getText()).toLowerCase();
      if (!drawerText.includes('chamados ativos na ala') && !drawerText.includes('dados de cadastro')) {
        throw new Error(`Conteúdo esperado na Ficha 360 não encontrado: ${drawerText.slice(0, 150)}`);
      }

      await takeScreenshot(driver, 'membros_360_drawer_pass');

      // Close drawer
      const closeBtn = await driver.findElement(By.css('.drawer-close-btn'));
      await closeBtn.click();
      await driver.sleep(300);

      const openDrawers = await driver.findElements(By.css('.drawer-panel'));
      if (openDrawers.length > 0) {
        throw new Error('A gaveta 360° deveria estar fechada após clicar no botão de fechar');
      }
    });
  });
}
