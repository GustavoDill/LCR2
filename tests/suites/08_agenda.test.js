import { By, until } from 'selenium-webdriver';
import { CONFIG } from '../config.js';
import { loginAsBispado, takeScreenshot } from '../driver.js';

export function registerAgendaTests(runner) {
  runner.suite('Agenda de Eventos', (s) => {
    s.beforeAll(async (driver) => {
      await loginAsBispado(driver);
    });

    s.test('Carrega página /agenda com cabeçalho', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/agenda`);
      const h2 = await driver.wait(until.elementLocated(By.css('h2')), CONFIG.timeout);
      const text = await h2.getText();
      if (!text.includes('Agenda')) {
        throw new Error(`Esperado título com "Agenda", obteve: "${text}"`);
      }
    });

    s.test('Exibe lista de eventos ou indicador de agenda', async (driver) => {
      const pageText = await driver.findElement(By.css('body')).getText();
      if (!pageText.includes('Agenda') && !pageText.includes('Evento') && !pageText.includes('calendário')) {
        throw new Error('Conteúdo da agenda não encontrado');
      }

      await takeScreenshot(driver, 'agenda_pass');
    });
  });
}
