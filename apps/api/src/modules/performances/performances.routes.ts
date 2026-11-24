import { Router } from 'express';
import { performancesController } from './performances.controller';

export const performancesRouter = Router();

performancesRouter.get('/', performancesController.list);
performancesRouter.get('/filters', performancesController.filters);
