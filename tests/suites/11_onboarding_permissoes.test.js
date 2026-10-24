import { By, until } from 'selenium-webdriver';
import { CONFIG } from '../config.js';
import { loginAsBispado, takeScreenshot } from '../driver.js';

export function registerOnboardingPermissoesTests(runner) {
  runner.suite('Onboarding de Novos Usuários e Governança de Permissões', (s) => {
    s.test('Login: Aba de criação de conta exibe aviso de segurança sobre zero permissões por padrão', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/login`);
      await driver.sleep(400);

      // Click "Primeiro Acesso" tab
      const btnCriarConta = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(text(), 'Primeiro Acesso') or contains(text(), 'Criar Conta')]")),
        CONFIG.timeout
      );
      await btnCriarConta.click();
      await driver.sleep(300);

      // Verify governance message
      const infoMsg = await driver.wait(
        until.elementLocated(By.xpath("//*[contains(., 'Por padrão, novos cadastros são criados sem nenhuma permissão de acesso')]")),
        CONFIG.timeout
      );
      if (!infoMsg) {
        throw new Error('Aviso institucional de zero permissões não encontrado no formulário de cadastro.');
      }

      await takeScreenshot(driver, 'onboarding_signup_notice_pass');
    });

    s.test('Governança: Usuário pendente é interceptado pela tela de solicitação de acesso', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/login`);

      // Inject a pending user profile into localStorage
      await driver.executeScript(`
        localStorage.setItem('lcr2_dev_user', JSON.stringify({
          uid: 'dev-pending-selenium',
          email: 'novo.lider@alabosque.org',
          displayName: 'Novo Líder da Ala',
          role: 'conselho',
          isBishopric: false,
          canWrite: false,
          statusAcesso: 'pendente',
          cargo: 'Aguardando Aprovação',
          permissoes: {
            inicio: 'none',
            reuniao: 'none',
            designacoes: 'none',
            mural: 'none',
            chamados: 'none',
            pessoas: 'none',
            membros: 'none',
            seminario: 'none',
            financeiro: 'none',
            agenda: 'none',
            atividades: 'none',
            natal: 'none',
            indicadores: 'none',
            atas: 'none',
            importar: 'none',
            gerenciamento: 'none'
          }
        }));
      `);

      // Navigate to protected root
      await driver.get(`${CONFIG.baseUrl}/`);
      await driver.sleep(500);

      // Verify AwaitingApprovalView is rendered
      const pendingH1 = await driver.wait(
        until.elementLocated(By.xpath("//h1[contains(text(), 'Ala Bosque · Gestão Pastoral')]")),
        CONFIG.timeout
      );
      if (!pendingH1) {
        throw new Error('Cabeçalho da tela de aguardo de aprovação não encontrado.');
      }

      const pendingSub = await driver.findElement(By.xpath("//p[contains(text(), 'Aguardando Liberação de Permissões')]"));
      if (!pendingSub) {
        throw new Error('Subtítulo de aguardo de liberação não encontrado.');
      }

      // Verify presence of form fields
      const inputCargo = await driver.findElement(By.xpath("//input[@placeholder='Ex: 1ª Conselheira da Sociedade de Socorro, Secretário, etc.']"));
      if (!inputCargo) {
        throw new Error('Campo de chamado não encontrado na tela de aguardo.');
      }

      const btnEnviar = await driver.findElement(By.xpath("//button[contains(text(), 'Enviar Solicitação de Acesso')]"));
      if (!btnEnviar) {
        throw new Error('Botão de envio de solicitação não encontrado.');
      }

      await takeScreenshot(driver, 'onboarding_awaiting_approval_pass');

      // Cleanup: restore bishopric
      await loginAsBispado(driver);
    });

    s.test('Governança: Usuário sem permissões não vê as abas das quais não possui acesso', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/login`);
      await driver.sleep(200);

      // Simulate an active user who ONLY has access to Mural and Atividades
      await driver.executeScript(`
        localStorage.setItem('lcr2_dev_user', JSON.stringify({
          uid: 'dev-lider-restrito-001',
          email: 'lider.restrito@alabosque.org',
          displayName: 'Líder com Permissões Restritas',
          role: 'conselho',
          isBishopric: false,
          canWrite: true,
          statusAcesso: 'aprovado',
          cargo: 'Líder Específico',
          permissoes: {
            inicio: 'none',
            reuniao: 'none',
            designacoes: 'none',
            mural: 'read',
            chamados: 'none',
            pessoas: 'none',
            membros: 'none',
            seminario: 'none',
            financeiro: 'none',
            agenda: 'none',
            atividades: 'write',
            natal: 'none',
            indicadores: 'none',
            atas: 'none',
            importar: 'none',
            gerenciamento: 'none'
          }
        }));
      `);

      // Navigate to /mural (where they have access)
      await driver.get(`${CONFIG.baseUrl}/mural`);
      await driver.sleep(600);

      // Verify that tabs for which user lacks permission are NOT present in the sidebar
      const tabsNav = await driver.wait(until.elementLocated(By.id('tabs')), CONFIG.timeout);

      // Should have Mural and Atividades links
      const linkMural = await tabsNav.findElements(By.xpath(".//a[@href='/mural']"));
      const linkAtividades = await tabsNav.findElements(By.xpath(".//a[@href='/atividades']"));
      if (linkMural.length === 0 || linkAtividades.length === 0) {
        throw new Error('Abas permitidas (Mural e Atividades) deveriam estar visíveis.');
      }

      // Should NOT have Financeiro, Gerenciamento, Seminário, Pessoas, Atas
      const forbiddenTabs = ['/financeiro', '/gerenciamento', '/seminario', '/pessoas', '/atas', '/chamados'];
      for (const fPath of forbiddenTabs) {
        const found = await tabsNav.findElements(By.xpath(`.//a[@href='${fPath}']`));
        if (found.length > 0) {
          throw new Error(`Aba não autorizada "${fPath}" está indevidamente visível no menu lateral!`);
        }
      }

      // Verify that directly typing forbidden URL redirects away
      await driver.get(`${CONFIG.baseUrl}/financeiro`);
      await driver.sleep(500);
      const urlAfterForbidden = await driver.getCurrentUrl();
      if (urlAfterForbidden.includes('/financeiro')) {
        throw new Error(`Acesso direto a rota não autorizada /financeiro não foi bloqueado! (URL: ${urlAfterForbidden})`);
      }

      await takeScreenshot(driver, 'onboarding_restricted_tabs_pass');

      // Cleanup
      await loginAsBispado(driver);
    });

    s.test('Governança: Usuário com zero permissões vê estado de bloqueio institucional e nenhuma aba liberada no menu lateral', async (driver) => {
      await driver.get(`${CONFIG.baseUrl}/login`);
      await driver.sleep(200);

      // Simulate an active user with zero permissions across all modules
      await driver.executeScript(`
        localStorage.setItem('lcr2_dev_user', JSON.stringify({
          uid: 'dev-zero-total-user',
          email: 'zero.acesso@alabosque.org',
          displayName: 'Usuário Sem Acesso',
          role: 'conselho',
          isBishopric: false,
          canWrite: false,
          statusAcesso: 'aprovado',
          cargo: 'Membro',
          permissoes: {
            inicio: 'none',
            reuniao: 'none',
            designacoes: 'none',
            mural: 'none',
            chamados: 'none',
            pessoas: 'none',
            membros: 'none',
            seminario: 'none',
            financeiro: 'none',
            agenda: 'none',
            atividades: 'none',
            natal: 'none',
            indicadores: 'none',
            atas: 'none',
            importar: 'none',
            gerenciamento: 'none'
          }
        }));
      `);

      await driver.get(`${CONFIG.baseUrl}/`);
      await driver.sleep(600);

      // Verify that no tab links (<a> elements inside #tabs) exist
      const tabsNav = await driver.wait(until.elementLocated(By.id('tabs')), CONFIG.timeout);
      const links = await tabsNav.findElements(By.tagName('a'));
      if (links.length > 0) {
        throw new Error(`Usuário sem permissões possui ${links.length} abas visíveis no menu lateral! Esperado: 0.`);
      }

      // Verify sidebar displays "Nenhum módulo liberado"
      const emptySbMsg = await tabsNav.findElement(By.xpath(".//*[contains(text(), 'Nenhum módulo liberado')]"));
      if (!emptySbMsg) {
        throw new Error('Mensagem institucional de abas vazias não encontrada na barra lateral.');
      }

      // Verify page content displays "Nenhum Módulo Liberado" card
      const lockedCard = await driver.wait(
        until.elementLocated(By.xpath("//*[contains(text(), 'Nenhum Módulo Liberado')]")),
        CONFIG.timeout
      );
      if (!lockedCard) {
        throw new Error('Card institucional de Nenhum Módulo Liberado não encontrado na página.');
      }

      await takeScreenshot(driver, 'onboarding_zero_permissions_lock_pass');

      // Cleanup: restore bishopric
      await loginAsBispado(driver);
    });

    s.test('Central de Gerenciamento: Exibe o UID de cada usuário na tabela, no modal de edição e no seletor de permissões', async (driver) => {
      await loginAsBispado(driver);
      await driver.get(`${CONFIG.baseUrl}/gerenciamento`);
      await driver.sleep(500);

      // 1. Verify subtab Usuários displays UID in the table rows
      const btnUsuarios = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(text(), 'Usuários')]")),
        CONFIG.timeout
      );
      await btnUsuarios.click();

      // Wait for table rows to load and check UID code badge
      await driver.wait(until.elementLocated(By.xpath("//td//code")), CONFIG.timeout);
      const uidCodes = await driver.findElements(By.xpath("//td//code[contains(text(), 'dev-') or contains(text(), 'local-') or string-length(text()) > 0]"));
      if (uidCodes.length === 0) {
        throw new Error('Nenhum identificador UID encontrado nas linhas da tabela de usuários.');
      }
      const firstUidText = await uidCodes[0].getText();
      if (!firstUidText || firstUidText.trim().length === 0) {
        throw new Error('Texto do UID na tabela está vazio.');
      }

      // 2. Open Edit User Modal and check UID input
      const editButtons = await driver.findElements(By.xpath("//button[@title='Editar dados cadastrais']"));
      if (editButtons.length === 0) {
        throw new Error('Botão de editar usuário não encontrado.');
      }
      await editButtons[0].click();
      await driver.sleep(300);

      const modalUidInput = await driver.wait(
        until.elementLocated(By.xpath("//label[contains(text(), 'Identificador Único (UID)')]/following-sibling::input")),
        CONFIG.timeout
      );
      const modalUidVal = await modalUidInput.getAttribute('value');
      if (!modalUidVal || modalUidVal.trim().length === 0) {
        throw new Error('Campo UID no modal de edição do usuário está vazio.');
      }

      // Close modal
      const cancelBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Cancelar')]"));
      await cancelBtn.click();
      await driver.sleep(300);

      // 3. Switch to Permissões Granulares and verify user select contains UID
      const btnPermissoes = await driver.findElement(By.xpath("//button[contains(text(), 'Permissões Granulares')]"));
      await btnPermissoes.click();
      await driver.sleep(400);

      const selectUser = await driver.wait(
        until.elementLocated(By.xpath("//select[contains(@class, 'input')]")),
        CONFIG.timeout
      );
      const selectOptions = await selectUser.findElements(By.tagName('option'));
      let foundUidInOption = false;
      for (const opt of selectOptions) {
        const text = await opt.getText();
        if (text.includes('UID:')) {
          foundUidInOption = true;
          break;
        }
      }
      if (!foundUidInOption) {
        throw new Error('Nenhuma opção no seletor de permissões contém o texto "UID:".');
      }

      // Check UID in active user card header
      const activeUidCode = await driver.findElement(By.xpath("//div[contains(text(), 'UID:')]//code"));
      const activeUidVal = await activeUidCode.getText();
      if (!activeUidVal || activeUidVal.trim().length === 0) {
        throw new Error('UID do usuário ativo não encontrado no cabeçalho de permissões.');
      }

      await takeScreenshot(driver, 'gerenciamento_uid_display_pass');
    });
  });
}
