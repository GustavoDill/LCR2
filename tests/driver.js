import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';
import path from 'path';
import { CONFIG } from './config.js';

export async function createDriver() {
  const options = new chrome.Options();
  if (CONFIG.headless) {
    options.addArguments('--headless=new');
  }
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments(`--window-size=${CONFIG.windowSize.width},${CONFIG.windowSize.height}`);

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  // Set default implicit timeout
  await driver.manage().setTimeouts({ implicit: 2000 });

  return driver;
}

export async function loginAsBispado(driver) {
  await driver.get(`${CONFIG.baseUrl}/login`);
  const devBtn = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Simular Bispado')]")),
    CONFIG.timeout
  );
  await devBtn.click();
  // Wait for redirect to home or layout
  await driver.wait(until.elementLocated(By.css('.shell, .main, .sb')), CONFIG.timeout);
}

export async function loginAsConselho(driver) {
  await driver.get(`${CONFIG.baseUrl}/login`);
  const devBtn = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Simular Conselho')]")),
    CONFIG.timeout
  );
  await devBtn.click();
  await driver.wait(until.elementLocated(By.css('.shell, .main, .sb')), CONFIG.timeout);
}

export async function logout(driver) {
  try {
    const logoutBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Sair')]"));
    await logoutBtn.click();
    await driver.wait(until.urlContains('/login'), CONFIG.timeout);
  } catch {
    await driver.get(`${CONFIG.baseUrl}/login`);
  }
}

export async function takeScreenshot(driver, filename) {
  if (!fs.existsSync(CONFIG.screenshotsDir)) {
    fs.mkdirSync(CONFIG.screenshotsDir, { recursive: true });
  }
  const cleanName = filename.endsWith('.png') ? filename : `${filename}.png`;
  const filePath = path.join(CONFIG.screenshotsDir, cleanName);
  const screenshotBase64 = await driver.takeScreenshot();
  fs.writeFileSync(filePath, screenshotBase64, 'base64');
  return filePath;
}

export async function waitForElement(driver, locator, timeout = CONFIG.timeout) {
  return driver.wait(until.elementLocated(locator), timeout);
}

export async function safeGetText(driver, locator, timeout = CONFIG.timeout) {
  const el = await driver.wait(until.elementLocated(locator), timeout);
  return el.getText();
}
