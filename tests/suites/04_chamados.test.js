import { By, until } from 'selenium-webdriver';
import { CONFIG } from '../config.js';
import { loginAsBispado, takeScreenshot } from '../driver.js';

export function registerChamadosTests(runner) {
  runner.suite('Lista de Chamados e Seletor de Membros', (s) => {
    s.beforeAll(async (driver) => {
      await loginAsBispado(driver);
    });

    s.test('Carrega página /chamados com organizações e cargos', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/chamados`);
      const h2 = await driver.wait(until.elementLocated(By.css('h2')), CONFIG.timeout);
      const text = await h2.getText();
      if (!text.includes('Lista de Chamados')) {
        throw new Error(`Esperado título com "Lista de Chamados", obteve: "${text}"`);
      }

      // Check organization cards
      const orgs = await driver.findElements(By.css('.ch-org'));
      if (orgs.length === 0) {
        throw new Error('Nenhuma organização renderizada na lista de chamados');
      }
    });

    s.test('Modal de troca/preenchimento abre ao clicar em Trocar ou Preencher', async (driver) => {
      const btn = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(@class, 'btn') and (contains(text(), 'Trocar') or contains(text(), 'Preencher'))]")),
        CONFIG.timeout
      );
      await btn.click();

      // Wait for modal sheet
      const modal = await driver.wait(until.elementLocated(By.css('.modal .sheet')), CONFIG.timeout);
      const modalText = await modal.getText();
      if (!modalText.includes('Trocar') && !modalText.includes('Preencher')) {
        throw new Error(`Título do modal inesperado: ${modalText}`);
      }
    });

    s.test('Seletor de membros possui "(Nenhum)" como primeira opção', async (driver) => {
      const select = await driver.findElement(By.css('.modal select.inp'));
      const options = await select.findElements(By.css('option'));
      if (options.length === 0) {
        throw new Error('Nenhuma opção no select de membros');
      }

      const firstOptionText = await options[0].getText();
      if (!firstOptionText.includes('(Nenhum)')) {
        throw new Error(`Primeira opção esperada "(Nenhum)", encontrada: "${firstOptionText}"`);
      }
    });

    s.test('Campo de busca rápida filtra membros no modal', async (driver) => {
      const searchInput = await driver.findElement(By.css(".modal input[type='search']"));
      await searchInput.sendKeys('Silva');
      await driver.sleep(300);

      const select = await driver.findElement(By.css('.modal select.inp'));
      const options = await select.findElements(By.css('option'));
      // The options should be filtered to only matching members plus (Nenhum)
      const texts = await Promise.all(options.map((o) => o.getText()));
      const matches = texts.filter((t) => t.toLowerCase().includes('silva') || t.includes('(Nenhum)'));

      if (matches.length !== texts.length) {
        throw new Error('Filtro de busca não filtrou corretamente as opções do select');
      }

      // Cancel and close modal
      const cancelBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Cancelar')]"));
      await cancelBtn.click();
      await driver.sleep(300);

      await takeScreenshot(driver, 'chamados_pass');
    });
  });
}
