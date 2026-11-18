import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { apiRouter } from './routes';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';

// Crea la aplicación sin abrir un puerto, para poder probarla con Supertest.
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
