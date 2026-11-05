import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import loyaltyRoutes from './routes/loyaltyRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger in dev
  if (ENV.NODE_ENV !== 'test') {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
      });
      next();
    });
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'QMS Backend API', timestamp: new Date() });
  });

  // Mount API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/queues', queueRoutes);
  app.use('/api/staff', staffRoutes);
  app.use('/api/branches', branchRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/devices', deviceRoutes);
  app.use('/api/loyalty', loyaltyRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/admin', adminRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ success: false, error: `Yo‘nalish topilmadi: ${req.method} ${req.url}` });
  });

  // Centralized Error handler
  app.use(errorHandler);

  return app;
}

