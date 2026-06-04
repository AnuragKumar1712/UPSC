import express from 'express';
import cors from 'cors';
import session from 'express-session';
import authRoutes from './routes/auth.routes.js';
import sectionsRoutes from './routes/sections.routes.js';
import topicsRoutes from './routes/topics.routes.js';
import questionsRoutes from './routes/questions.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import bookmarksRoutes from './routes/bookmarks.routes.js';
import revisionRoutes from './routes/revision.routes.js';
import settingsRoutes from './routes/settings.routes.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
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

  return app;
}
