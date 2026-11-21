import { Router } from 'express';
import { artistsController } from './artists.controller';

export const artistsRouter = Router();

artistsRouter.get('/', artistsController.list);
artistsRouter.get('/:id', artistsController.getById);
