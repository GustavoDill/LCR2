import { runner } from './runner.js';
import { registerAuthTests } from './suites/01_auth.test.js';
import { registerIndicadoresTests } from './suites/02_indicadores.test.js';
import { registerSeminarioTests } from './suites/03_seminario.test.js';
import { registerChamadosTests } from './suites/04_chamados.test.js';
import { registerMembrosTests } from './suites/05_membros.test.js';
import { registerAtividadesTests } from './suites/06_atividades.test.js';
import { registerFinanceiroTests } from './suites/07_financeiro.test.js';
import { registerAgendaTests } from './suites/08_agenda.test.js';
import { registerDesignacoesReuniaoTests } from './suites/09_designacoes_reuniao.test.js';
import { registerGerenciamentoPastoralTests } from './suites/10_gerenciamento_pastoral.test.js';
import { registerOnboardingPermissoesTests } from './suites/11_onboarding_permissoes.test.js';

// =========================================================================
// REGISTRO DE SUÍTES: Adicione novas suítes de features existentes ou futuras aqui
// =========================================================================
registerAuthTests(runner);
registerIndicadoresTests(runner);
registerSeminarioTests(runner);
registerChamadosTests(runner);
registerMembrosTests(runner);
registerAtividadesTests(runner);
registerFinanceiroTests(runner);
registerAgendaTests(runner);
registerDesignacoesReuniaoTests(runner);
registerGerenciamentoPastoralTests(runner);
registerOnboardingPermissoesTests(runner);

// Exemplo para futuras features:
// import { registerNovaFeatureTests } from './suites/09_nova_feature.test.js';
// registerNovaFeatureTests(runner);

// =========================================================================
// EXECUÇÃO
// =========================================================================
async function main() {
  const args = process.argv.slice(2);
  let filterSuite = null;
  let filterTest = null;

  for (const arg of args) {
    if (arg.startsWith('--suite=')) {
      filterSuite = arg.split('=')[1];
    } else if (arg.startsWith('--filter=')) {
      filterTest = arg.split('=')[1];
    }
  }

  const success = await runner.run(filterSuite, filterTest);
  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  console.error('\nErro fatal na execução da suíte de testes:', err);
  process.exit(1);
});
