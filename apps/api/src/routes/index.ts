import { Router } from 'express';
import { healthRouter } from '../modules/health/health.routes';
import { festivalRouter } from '../modules/festival/festival.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { reservationsRouter } from '../modules/reservations/reservations.routes';
import { adminVenuesRouter } from '../modules/admin/venues/admin-venues.routes';

// Punto único donde se registran los módulos bajo /api.
// Specs #2 y #3: agregar aquí una línea por cada módulo nuevo.
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/festival', festivalRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/reservations', reservationsRouter);
apiRouter.use('/admin/venues', adminVenuesRouter);
