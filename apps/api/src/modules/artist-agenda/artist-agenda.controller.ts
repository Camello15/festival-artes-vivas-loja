import type { Request, Response } from 'express';
import { AppError } from '../../errors/AppError';
import { artistAgendaService } from './artist-agenda.service';

export const artistAgendaController = {
  async listMine(req: Request, res: Response) {
    if (!req.user) throw new AppError('UNAUTHORIZED', 'Debes iniciar sesión');
    res.status(200).json(await artistAgendaService.listForUser(req.user.id));
  },
};
