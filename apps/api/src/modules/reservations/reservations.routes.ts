import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { reservationsController } from './reservations.controller';

export const reservationsRouter = Router();

reservationsRouter.post('/', requireAuth, reservationsController.create);
reservationsRouter.get('/me', requireAuth, reservationsController.listMine);
reservationsRouter.patch('/:id/cancel', requireAuth, reservationsController.cancel);
