import { By, until } from 'selenium-webdriver';
import { CONFIG } from '../config.js';
import { loginAsBispado, takeScreenshot } from '../driver.js';

export function registerIndicadoresTests(runner) {
  runner.suite('Indicadores - Painel de Saúde da Ala', (s) => {
    s.beforeAll(async (driver) => {
      await loginAsBispado(driver);
    });

    s.test('Carrega página /indicadores com cabeçalho autêntico', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/indicadores`);
      const h2 = await driver.wait(until.elementLocated(By.css('h2')), CONFIG.timeout);
      const text = await h2.getText();
      if (!text.includes('Painel de saúde da ala')) {
        throw new Error(`Esperado "Painel de saúde da ala", obteve: "${text}"`);
      }
    });

    s.test('Exibe o seletor de mês com "outubro 2026"', async (driver) => {
      const monthEl = await driver.findElement(By.css('.mnav .m'));
      const text = await monthEl.getText();
      if (!text.toLowerCase().includes('outubro 2026')) {
        throw new Error(`Esperado mês "outubro 2026", obteve: "${text}"`);
      }
    });

    s.test('Renderiza exatamente 11 cards de indicadores (.icell)', async (driver) => {
      const cards = await driver.findElements(By.css('.icell'));
      if (cards.length !== 11) {
        throw new Error(`Esperado 11 cards, encontrado: ${cards.length}`);
      }
    });

    s.test('Card de Reunião Sacramental possui valor numérico correto (150)', async (driver) => {
      const input = await driver.findElement(By.id('ind-sacramental'));
      const val = await input.getAttribute('value');
      if (val !== '150') {
        throw new Error(`Esperado valor 150 para Sacramental, obteve: "${val}"`);
      }
    });

    s.test('Tabela dos últimos 6 meses possui 11 linhas e coluna de tendência', async (driver) => {
      const rows = await driver.findElements(By.css('.tscroll tbody tr'));
      if (rows.length !== 11) {
        throw new Error(`Esperado 11 linhas na tabela de histórico, encontrado: ${rows.length}`);
      }
      const headers = await driver.findElements(By.css('.tscroll thead th'));
      const headerTexts = await Promise.all(headers.map((h) => h.getText()));
      if (!headerTexts.includes('TENDÊNCIA')) {
        throw new Error(`Coluna TENDÊNCIA não encontrada. Cabeçalhos: ${headerTexts.join(', ')}`);
      }
    });

    s.test('Navegação de mês anterior e próximo funciona corretamente', async (driver) => {
      const prevBtn = await driver.findElement(By.css(".mnav button[aria-label='Mês anterior']"));
      await prevBtn.click();
      await driver.sleep(300);

      const mText = await driver.findElement(By.css('.mnav .m')).getText();
      if (!mText.toLowerCase().includes('setembro 2026')) {
        throw new Error(`Esperado mês recuar para setembro 2026, obteve: "${mText}"`);
      }

      const nextBtn = await driver.findElement(By.css(".mnav button[aria-label='Próximo mês']"));
      await nextBtn.click();
      await driver.sleep(300);

      const backText = await driver.findElement(By.css('.mnav .m')).getText();
      if (!backText.toLowerCase().includes('outubro 2026')) {
        throw new Error(`Esperado mês avançar para outubro 2026, obteve: "${backText}"`);
      }

      await takeScreenshot(driver, 'indicadores_pass');
    });
  });
}
