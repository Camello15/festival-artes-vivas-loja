import { Router } from 'express';
import { healthRouter } from '../modules/health/health.routes';
import { festivalRouter } from '../modules/festival/festival.routes';
import { performancesRouter } from '../modules/performances/performances.routes';
import { eventsRouter } from '../modules/events/events.routes';

// Punto único donde se registran los módulos bajo /api.
// Specs #2 y #3: agregar aquí una línea por cada módulo nuevo.
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/festival', festivalRouter);
apiRouter.use('/performances', performancesRouter);
apiRouter.use('/events', eventsRouter);
