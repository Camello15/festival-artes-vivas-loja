import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middlewares/auth';
import { adminArtistsController } from './admin-artists.controller';

export const adminArtistsRouter = Router();

adminArtistsRouter.use(requireAuth, requireRole('ADMIN'));
adminArtistsRouter.get('/', adminArtistsController.list);
adminArtistsRouter.get('/:id', adminArtistsController.get);
adminArtistsRouter.post('/', adminArtistsController.create);
adminArtistsRouter.put('/:id', adminArtistsController.update);
adminArtistsRouter.delete('/:id', adminArtistsController.delete);
