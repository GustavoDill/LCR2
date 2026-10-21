import { By, until } from 'selenium-webdriver';
import { CONFIG } from '../config.js';
import { loginAsBispado, loginAsConselho, logout, waitForElement } from '../driver.js';

export function registerAuthTests(runner) {
  runner.suite('Autenticação e Controle de Acesso', (s) => {
    s.test('Página de Login carrega elementos essenciais', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/login`);
      const heading = await driver.findElement(By.css('h1')).getText();
      if (!heading.includes('Portal Bispado')) {
        throw new Error(`Esperado título com "Portal Bispado", obteve: "${heading}"`);
      }
    });

    s.test('Simular Bispado realiza login e redireciona', async (driver) => {
      await loginAsBispado(driver);
      const url = await driver.getCurrentUrl();
      if (url.includes('/login')) {
        throw new Error('Não redirecionou após login');
      }

      // Check header or user tag
      const userBadge = await waitForElement(driver, By.css('.top .today, .top-t, .sb-bt'));
      const text = await userBadge.getText();
      if (!text && !(await driver.findElement(By.css('body')).getText()).includes('Ala Bosque')) {
        throw new Error('Identificador da ala não encontrado no layout');
      }
    });

    s.test('Acesso a rotas restritas sem autenticação redireciona para login', async (driver) => {
      await logout(driver);
      await driver.get(`${CONFIG.baseUrl}/chamados`);
      await driver.wait(until.urlContains('/login'), CONFIG.timeout);
      const currentUrl = await driver.getCurrentUrl();
      if (!currentUrl.includes('/login')) {
        throw new Error(`Esperado redirecionamento para login, mas URL atual é: ${currentUrl}`);
      }
    });

    s.test('Login como Bispado concede acesso total', async (driver) => {
      await loginAsBispado(driver);
      await driver.get(`${CONFIG.baseUrl}/chamados`);
      await driver.wait(until.elementLocated(By.css('h2')), CONFIG.timeout);
      const heading = await driver.findElement(By.css('h2')).getText();
      if (!heading.includes('Chamados')) {
        throw new Error(`Esperado acesso a Chamados, obteve título: ${heading}`);
      }
    });
  });
}
