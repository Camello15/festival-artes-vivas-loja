import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { artistAgendaController } from './artist-agenda.controller';

export const artistAgendaRouter = Router();

artistAgendaRouter.use(requireAuth, requireRole('ARTIST'));
artistAgendaRouter.get('/', artistAgendaController.listMine);
