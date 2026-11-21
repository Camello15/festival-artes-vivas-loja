import { Router } from 'express';
import { venuesController } from './venues.controller';

export const venuesRouter = Router();

venuesRouter.get('/', venuesController.list);
venuesRouter.get('/:id', venuesController.getById);
