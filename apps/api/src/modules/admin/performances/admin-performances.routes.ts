import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middlewares/auth';
import { adminPerformancesController } from './admin-performances.controller';

export const adminPerformancesRouter = Router();

adminPerformancesRouter.use(requireAuth, requireRole('ADMIN'));
adminPerformancesRouter.get('/', adminPerformancesController.list);
adminPerformancesRouter.get('/:id/reservations', adminPerformancesController.listReservations);
adminPerformancesRouter.get('/:id', adminPerformancesController.get);
adminPerformancesRouter.post('/', adminPerformancesController.create);
adminPerformancesRouter.put('/:id', adminPerformancesController.update);
adminPerformancesRouter.patch('/:id/cancel', adminPerformancesController.cancel);
adminPerformancesRouter.delete('/:id', adminPerformancesController.delete);
