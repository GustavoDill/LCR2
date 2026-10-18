import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import designacoesRoutes from './routes/designacoes.js';
import reunioesRoutes from './routes/reunioes.js';
import pessoasRoutes from './routes/pessoas.js';
import chamadosRoutes from './routes/chamados.js';
import membrosRoutes from './routes/membros.js';
import sirRoutes from './routes/sir.js';
import financeiroRoutes from './routes/financeiro.js';
import agendaRoutes from './routes/agenda.js';
import atividadesRoutes from './routes/atividades.js';
import natalRoutes from './routes/natal.js';
import indicadoresRoutes from './routes/indicadores.js';
import seedRoutes from './routes/seed.js';

export function createApp() {
  const app = express();

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive for local network/dev access
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-role'],
    })
  );

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount API endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/designacoes', designacoesRoutes);
  app.use('/api/reunioes', reunioesRoutes);
  app.use('/api/atas', reunioesRoutes);
  app.use('/api/pessoas', pessoasRoutes);
  app.use('/api/chamados', chamadosRoutes);
  app.use('/api/membros', membrosRoutes);
  app.use('/api/sir', sirRoutes);
  app.use('/api/financeiro', financeiroRoutes);
  app.use('/api/agenda', agendaRoutes);
  app.use('/api/atividades', atividadesRoutes);
  app.use('/api/natal', natalRoutes);
  app.use('/api/indicadores', indicadoresRoutes);
  app.use('/api/seed', seedRoutes);

  // Global 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado.' });
  });

  return app;
}
