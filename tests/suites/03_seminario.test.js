import { By, until } from 'selenium-webdriver';
import { CONFIG } from '../config.js';
import { loginAsBispado, takeScreenshot } from '../driver.js';

export function registerSeminarioTests(runner) {
  runner.suite('Seminário e Instituto', (s) => {
    s.beforeAll(async (driver) => {
      await loginAsBispado(driver);
    });

    s.test('Carrega página /seminario com título e subtítulo', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/seminario`);
      const h2 = await driver.wait(until.elementLocated(By.css('h2')), CONFIG.timeout);
      const text = await h2.getText();
      if (!text.includes('Seminário e Instituto')) {
        throw new Error(`Esperado "Seminário e Instituto", obteve: "${text}"`);
      }
    });

    s.test('Card do Seminário possui métricas e ranking 6º de 7', async (driver) => {
      const semCard = await driver.findElement(By.css('.p-seminario'));
      const text = await semCard.getText();
      if (!text.includes('matriculados de 57') || !text.includes('14%')) {
        throw new Error(`Esperado "matriculados de 57" e "14%", obteve no card:\n${text}`);
      }
      if (!text.includes('6º de 7')) {
        throw new Error(`Esperado posição "6º de 7", obteve no card:\n${text}`);
      }
      if (!text.includes('24,2%')) {
        throw new Error(`Esperado média da estaca "24,2%", obteve no card:\n${text}`);
      }
    });

    s.test('Card do Instituto possui métricas e ranking 4º de 7', async (driver) => {
      const instCard = await driver.findElement(By.css('.p-instituto'));
      const text = await instCard.getText();
      if (!text.includes('matriculados de 167') || !text.includes('4,8%')) {
        throw new Error(`Esperado "matriculados de 167" e "4,8%", obteve no card:\n${text}`);
      }
      if (!text.includes('4º de 7')) {
        throw new Error(`Esperado posição "4º de 7", obteve no card:\n${text}`);
      }
      if (!text.includes('4,5%')) {
        throw new Error(`Esperado média da estaca "4,5%", obteve no card:\n${text}`);
      }
    });

    s.test('Seção de Alunos exibe os 4 blocos de métricas (14 alunos, 0 crédito, 5 pendência, 9 risco)', async (driver) => {
      const stats = await driver.findElements(By.css('.stats .stat'));
      if (stats.length < 4) {
        throw new Error(`Esperado 4 blocos de estatísticas, encontrado: ${stats.length}`);
      }

      const allStatsText = (await Promise.all(stats.map((st) => st.getText()))).join(' | ');
      if (!allStatsText.includes('14') || !allStatsText.includes('9') || !allStatsText.includes('5')) {
        throw new Error(`Valores das estatísticas não correspondem aos esperados: ${allStatsText}`);
      }
    });

    s.test('Tabela de alunos renderiza os 14 alunos com badges e barras de frequência', async (driver) => {
      const rows = await driver.findElements(By.css('.tscroll tbody tr'));
      if (rows.length !== 14) {
        throw new Error(`Esperado 14 alunos na tabela, encontrado: ${rows.length}`);
      }

      // Check first row has Leonardo Sodré Godinho
      const firstRowText = await rows[0].getText();
      if (!firstRowText.includes('Leonardo Sodré Godinho')) {
        throw new Error(`Esperado primeiro aluno "Leonardo Sodré Godinho", obteve: ${firstRowText}`);
      }
    });

    s.test('Filtros rápidos (chips) funcionam para alternar visualizações', async (driver) => {
      const seminarioChip = await driver.findElement(By.xpath("//button[contains(@class, 'chip') and contains(text(), 'Seminário')]"));
      await seminarioChip.click();
      await driver.sleep(200);

      const semRows = await driver.findElements(By.css('.tscroll tbody tr'));
      if (semRows.length !== 7) {
        throw new Error(`Esperado 7 alunos filtrados por Seminário, obteve: ${semRows.length}`);
      }

      const allChip = await driver.findElement(By.xpath("//button[contains(@class, 'chip') and contains(text(), 'Todos')]"));
      await allChip.click();
      await driver.sleep(200);

      const allRows = await driver.findElements(By.css('.tscroll tbody tr'));
      if (allRows.length !== 14) {
        throw new Error(`Esperado 14 alunos ao resetar filtro, obteve: ${allRows.length}`);
      }

      await takeScreenshot(driver, 'seminario_pass');
    });
  });
}
