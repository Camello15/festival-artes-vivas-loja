import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middlewares/auth';
import { adminEventsController } from './admin-events.controller';

export const adminEventsRouter = Router();

adminEventsRouter.use(requireAuth, requireRole('ADMIN'));
adminEventsRouter.get('/', adminEventsController.list);
adminEventsRouter.get('/:id', adminEventsController.get);
adminEventsRouter.post('/', adminEventsController.create);
adminEventsRouter.put('/:id', adminEventsController.update);
adminEventsRouter.delete('/:id', adminEventsController.delete);
