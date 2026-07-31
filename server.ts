import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import { initDatabase } from './src/server/db/database';
import authRoutes from './src/server/routes/auth';
import userRoutes from './src/server/routes/users';
import kuaDailyRoutes from './src/server/routes/kuaDaily';
import staffActivitiesRoutes from './src/server/routes/staffActivities';
import pejabatPenilaiRoutes from './src/server/routes/pejabatPenilai';
import telegramRoutes from './src/server/routes/telegram';
import exportRoutes from './src/server/routes/export';
import userTemplateRoutes from './src/server/routes/userTemplates';
import settingsRoutes from './src/server/routes/settings';
import metaRoutes from './src/server/routes/meta';

async function startServer() {
  await initDatabase();
  const app = express();
  const PORT = Number(process.env.PORT) || 7000;

  // Body parser middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Sistem Informasi Laporan Kinerja KUA API', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/kua-daily', kuaDailyRoutes);
  app.use('/api/staff-activities', staffActivitiesRoutes);
  app.use('/api/pejabat-penilai', pejabatPenilaiRoutes);
  app.use('/api/telegram', telegramRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/user-templates', userTemplateRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/meta', metaRoutes);

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server KUA running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
