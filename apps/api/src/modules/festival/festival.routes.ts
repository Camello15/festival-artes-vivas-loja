import { Router } from 'express';
import { festivalController } from './festival.controller';

export const festivalRouter = Router();

festivalRouter.get('/summary', festivalController.getSummary);
