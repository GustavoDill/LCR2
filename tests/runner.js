import { createDriver, takeScreenshot } from './driver.js';

class TestRunner {
  constructor() {
    this.suites = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      durationMs: 0,
      errors: [],
    };
  }

  suite(name, fn) {
    const suiteObj = {
      name,
      tests: [],
      beforeAll: null,
      afterAll: null,
    };

    const suiteCtx = {
      test: (testName, testFn) => {
        suiteObj.tests.push({ name: testName, fn: testFn });
      },
      beforeAll: (fn) => {
        suiteObj.beforeAll = fn;
      },
      afterAll: (fn) => {
        suiteObj.afterAll = fn;
      },
    };

    fn(suiteCtx);
    this.suites.push(suiteObj);
  }

  async run(filterSuite = null, filterTest = null) {
    const startTime = Date.now();
    console.log('\n======================================================');
    console.log('🚀 INICIANDO SUÍTE DE TESTES E2E DO LCR2 (SELENIUM)');
    console.log('======================================================\n');

    let driver = null;
    try {
      driver = await createDriver();

      for (const suite of this.suites) {
        if (filterSuite && !suite.name.toLowerCase().includes(filterSuite.toLowerCase())) {
          continue;
        }

        console.log(`\n📁 SUÍTE: ${suite.name}`);
        console.log('------------------------------------------------------');

        if (suite.beforeAll) {
          try {
            await suite.beforeAll(driver);
          } catch (err) {
            console.error(`  ❌ Falha no beforeAll da suíte "${suite.name}":`, err.message);
          }
        }

        for (const test of suite.tests) {
          if (filterTest && !test.name.toLowerCase().includes(filterTest.toLowerCase())) {
            continue;
          }

          this.results.total++;
          const tStart = Date.now();
          process.stdout.write(`  ⏳ ${test.name} ... `);

          try {
            await test.fn(driver);
            const duration = Date.now() - tStart;
            this.results.passed++;
            console.log(`\x1b[32m✓ PASS\x1b[0m (${duration}ms)`);
          } catch (err) {
            const duration = Date.now() - tStart;
            this.results.failed++;
            console.log(`\x1b[31m✗ FAIL\x1b[0m (${duration}ms)`);
            console.error(`     \x1b[31mErro:\x1b[0m ${err.message}`);

            // Take screenshot on failure
            const safeName = `FAIL_${suite.name}_${test.name}`.replace(/[^a-zA-Z0-9_]/g, '_');
            try {
              const shotPath = await takeScreenshot(driver, safeName);
              console.log(`     📸 Screenshot de erro salva em: ${shotPath}`);
            } catch (shotErr) {
              console.error(`     (Falha ao salvar screenshot: ${shotErr.message})`);
            }

            this.results.errors.push({
              suite: suite.name,
              test: test.name,
              error: err,
            });
          }
        }

        if (suite.afterAll) {
          try {
            await suite.afterAll(driver);
          } catch (err) {
            console.error(`  ⚠️ Falha no afterAll da suíte "${suite.name}":`, err.message);
          }
        }
      }
    } finally {
      if (driver) {
        await driver.quit();
      }
    }

    this.results.durationMs = Date.now() - startTime;
    this.printSummary();

    return this.results.failed === 0;
  }

  printSummary() {
    console.log('\n======================================================');
    console.log('📊 RESUMO DA EXECUÇÃO DOS TESTES');
    console.log('======================================================');
    console.log(`Total de testes:     ${this.results.total}`);
    console.log(`\x1b[32mTestes Aprovados:    ${this.results.passed}\x1b[0m`);
    console.log(`\x1b[31mTestes com Falha:    ${this.results.failed}\x1b[0m`);
    console.log(`Tempo total:         ${(this.results.durationMs / 1000).toFixed(2)}s`);
    console.log('======================================================\n');
  }
}

export const runner = new TestRunner();
