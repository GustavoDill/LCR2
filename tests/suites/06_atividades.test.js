import { By, until } from 'selenium-webdriver';
import { CONFIG } from '../config.js';
import { loginAsBispado, takeScreenshot } from '../driver.js';

export function registerAtividadesTests(runner) {
  runner.suite('Atividades da Ala', (s) => {
    s.beforeAll(async (driver) => {
      await loginAsBispado(driver);
    });

    s.test('Carrega página /atividades com cabeçalho', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/atividades`);
      const heading = await driver.wait(
        until.elementLocated(By.css('.atv-title')),
        CONFIG.timeout
      );
      const text = await heading.getText();
      if (!text.includes('Atividades')) {
        throw new Error(`Esperado título com "Atividades", obteve: "${text}"`);
      }
    });

    s.test('Exibe botões de filtro e colunas ou lista de atividades', async (driver) => {
      const pageText = await driver.findElement(By.css('body')).getText();
      if (!pageText.includes('Atividades') && !pageText.includes('Aguardando')) {
        throw new Error('Conteúdo essencial de atividades não encontrado');
      }
    });

    s.test('Botão para propor/criar atividade abre o formulário', async (driver) => {
      const btn = await driver.findElement(
        By.css('.atv-btn-new')
      );
      await btn.click();

      // Wait for modal
      const modal = await driver.wait(until.elementLocated(By.css('.modal, form')), CONFIG.timeout);
      const isVisible = await modal.isDisplayed();
      if (!isVisible) {
        throw new Error('Modal de atividade não ficou visível');
      }

      // Close modal
      try {
        const cancelBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Cancelar')]"));
        await cancelBtn.click();
      } catch {
        // click outside or escape
      }

      await takeScreenshot(driver, 'atividades_pass');
    });
  });
}
