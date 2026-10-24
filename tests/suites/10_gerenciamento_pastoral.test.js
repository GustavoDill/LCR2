import { By, until } from 'selenium-webdriver';
import { CONFIG } from '../config.js';
import { loginAsBispado, takeScreenshot } from '../driver.js';

export function registerGerenciamentoPastoralTests(runner) {
  runner.suite('Central de Gerenciamento e Acompanhamento Pastoral', (s) => {
    s.beforeAll(async (driver) => {
      await loginAsBispado(driver);
    });

    s.test('Seminário: Botão Acompanhar abre modal pastoral com métricas e formulário de designação', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/seminario`);
      await driver.wait(until.elementLocated(By.css('.tscroll tbody tr')), CONFIG.timeout);

      // Click "Acompanhar" on first student
      const btnAcompanhar = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(text(), 'Acompanhar')]")),
        CONFIG.timeout
      );
      await btnAcompanhar.click();
      await driver.sleep(300);

      // Verify modal is open with pastoral title
      const modalHeader = await driver.wait(
        until.elementLocated(By.xpath("//h3[contains(text(), 'Acompanhamento Pastoral:')]")),
        CONFIG.timeout
      );
      const headerText = await modalHeader.getText();
      if (!headerText.includes('Acompanhamento Pastoral')) {
        throw new Error(`Título do modal incorreto: "${headerText}"`);
      }

      // Check for pastoral task form
      const taskLabel = await driver.wait(
        until.elementLocated(By.xpath("//h4[contains(text(), 'Atribuir Designação Pastoral no Bispado')]")),
        CONFIG.timeout
      );
      if (!taskLabel) {
        throw new Error('Formulário de designação pastoral não encontrado no modal.');
      }

      // Close modal
      const cancelBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Cancelar')]"));
      await cancelBtn.click();
      await driver.sleep(200);
    });

    s.test('Navegação: Rota /importar redireciona automaticamente para /gerenciamento', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/importar`);
      await driver.sleep(400);

      const currentUrl = await driver.getCurrentUrl();
      if (!currentUrl.includes('/gerenciamento')) {
        throw new Error(`Esperado redirecionamento para /gerenciamento, obteve: "${currentUrl}"`);
      }
    });

    s.test('Página /gerenciamento exibe as 3 subabas e alterna entre Dados, Usuários e Permissões', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/gerenciamento`);
      const h1 = await driver.wait(
        until.elementLocated(By.xpath("//h1[contains(text(), 'Central de Gerenciamento')]")),
        CONFIG.timeout
      );
      const title = await h1.getText();
      if (!title.includes('Central de Gerenciamento')) {
        throw new Error(`Esperado "Central de Gerenciamento", obteve: "${title}"`);
      }

      // Verify subtabs buttons are rendered
      const btnDados = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(text(), 'Gerenciamento de Dados')]")),
        CONFIG.timeout
      );
      const btnUsuarios = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(text(), 'Usuários')]")),
        CONFIG.timeout
      );
      const btnPermissoes = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(text(), 'Permissões Granulares')]")),
        CONFIG.timeout
      );

      // Check Subtab 1: Dados contains LCR card and Firestore database audit
      await btnDados.click();
      await driver.sleep(300);
      const auditTitle = await driver.wait(
        until.elementLocated(By.xpath("//h3[contains(text(), 'Diagnóstico e Auditoria do Banco de Dados')]")),
        CONFIG.timeout
      );
      if (!auditTitle) {
        throw new Error('Painel de auditoria do banco de dados não encontrado na subaba Dados.');
      }

      // Check Subtab 2: Usuários contains table and user roles
      await btnUsuarios.click();
      await driver.sleep(300);
      const userTh = await driver.wait(
        until.elementLocated(By.xpath("//th[contains(text(), 'Papel no Sistema')]")),
        CONFIG.timeout
      );
      if (!userTh) {
        throw new Error('Tabela de usuários não encontrada na subaba Usuários.');
      }

      // Check Subtab 3: Permissões Granulares contains presets and matrix table
      await btnPermissoes.click();
      await driver.sleep(300);
      const matrixTitle = await driver.wait(
        until.elementLocated(By.xpath("//h3[contains(text(), 'Matriz de Permissões Granulares por Módulo')]")),
        CONFIG.timeout
      );
      if (!matrixTitle) {
        throw new Error('Matriz de permissões granulares não encontrada na subaba Permissões.');
      }

      // Check preset buttons are present
      const presetBisp = await driver.findElement(By.xpath("//button[contains(text(), 'Preset Bispado')]"));
      if (!presetBisp) {
        throw new Error('Botões de preset rápido não encontrados.');
      }

      await takeScreenshot(driver, 'gerenciamento_subtabs_pass');
    });

    s.test('Gerenciamento: Modal de usuário possui opção de receber notificações de novos cadastros', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/gerenciamento`);
      const btnUsuarios = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(text(), 'Usuários')]")),
        CONFIG.timeout
      );
      await btnUsuarios.click();
      await driver.sleep(400);

      // Find first Edit button
      const editButtons = await driver.findElements(By.xpath("//button[@title='Editar dados cadastrais']"));
      if (editButtons.length === 0) {
        throw new Error('Nenhum botão de editar usuário encontrado na tabela.');
      }
      await editButtons[0].click();
      await driver.sleep(300);

      // Check modal is open
      const modalH3 = await driver.wait(
        until.elementLocated(By.xpath("//h3[contains(text(), 'Editar Perfil do Usuário')]")),
        CONFIG.timeout
      );
      if (!modalH3) {
        throw new Error('Modal de edição de usuário não abriu.');
      }

      // Check checkbox "Usuário recebe pedidos de novo cadastro por e-mail?"
      const notifLabel = await driver.wait(
        until.elementLocated(By.xpath("//*[contains(text(), 'Usuário recebe pedidos de novo cadastro por e-mail?')]")),
        CONFIG.timeout
      );
      if (!notifLabel) {
        throw new Error('Opção de receber pedidos de novo cadastro por e-mail não encontrada no modal.');
      }

      // Close modal
      const cancelBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Cancelar')]"));
      await cancelBtn.click();
      await driver.sleep(200);

      await takeScreenshot(driver, 'gerenciamento_notif_checkbox_pass');
    });
  });
}
