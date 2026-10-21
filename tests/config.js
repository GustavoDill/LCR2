import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:5173',
  apiUrl: process.env.TEST_API_URL || 'http://localhost:5000/api',
  headless: !process.argv.includes('--headed'),
  timeout: 10000,
  windowSize: { width: 1440, height: 900 },
  screenshotsDir: path.join(__dirname, 'artifacts', 'screenshots'),
};
