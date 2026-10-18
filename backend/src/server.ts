import dotenv from 'dotenv';
import { createApp } from './app.js';
import { initFirebase } from './config/firebase.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    initFirebase();
    const app = createApp();

    app.listen(PORT, () => {
      console.log(`🚀 Bispado Ala Bosque Server running on port ${PORT}`);
      console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Fatal error during server startup:', error);
    process.exit(1);
  }
}

bootstrap();
