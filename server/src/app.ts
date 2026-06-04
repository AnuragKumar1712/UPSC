import express from 'express';
import cors from 'cors';
import session from 'express-session';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import sectionsRoutes from './routes/sections.routes.js';
import topicsRoutes from './routes/topics.routes.js';
import questionsRoutes from './routes/questions.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import bookmarksRoutes from './routes/bookmarks.routes.js';
import revisionRoutes from './routes/revision.routes.js';
import settingsRoutes from './routes/settings.routes.js';

function resolveClientUrl(): string {
  if (process.env.CLIENT_URL) return process.env.CLIENT_URL;
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  return 'http://localhost:5173';
}

export function createApp() {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    app.set('trust proxy', 1);
  }

  app.use(
    cors({
      origin: resolveClientUrl(),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'upsc-dev-secret-change-me',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/sections', sectionsRoutes);
  app.use('/api/topics', topicsRoutes);
  app.use('/api/questions', questionsRoutes);
  app.use('/api/quiz', quizRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/bookmarks', bookmarksRoutes);
  app.use('/api/revision', revisionRoutes);
  app.use('/api/settings', settingsRoutes);

  if (isProduction) {
    const clientDist = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../client/dist'
    );
    if (fs.existsSync(clientDist)) {
      app.use(express.static(clientDist));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(clientDist, 'index.html'));
      });
    }
  }

  return app;
}
