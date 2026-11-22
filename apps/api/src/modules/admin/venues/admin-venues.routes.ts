import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middlewares/auth';
import { adminVenuesController } from './admin-venues.controller';

export const adminVenuesRouter = Router();

adminVenuesRouter.use(requireAuth, requireRole('ADMIN'));
adminVenuesRouter.get('/', adminVenuesController.list);
adminVenuesRouter.get('/:id', adminVenuesController.get);
adminVenuesRouter.post('/', adminVenuesController.create);
adminVenuesRouter.put('/:id', adminVenuesController.update);
adminVenuesRouter.delete('/:id', adminVenuesController.delete);
