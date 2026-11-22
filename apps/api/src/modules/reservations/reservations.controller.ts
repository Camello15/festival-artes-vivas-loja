import type { Request, Response } from 'express';
import { AppError } from '../../errors/AppError';
import { reservationsService } from './reservations.service';
import { reserveSchema } from './reservations.schemas';
import { z } from 'zod';

const reservationIdSchema = z.coerce.number().int().positive();

export const reservationsController = {
  async create(req: Request, res: Response) {
    const input = reserveSchema.parse(req.body);
    if (!req.user) throw new AppError('UNAUTHORIZED', 'Debes iniciar sesión');

    const reservation = await reservationsService.reserve(req.user.id, input.performanceId, input.quantity);
    res.status(201).json(reservation);
  },

  async listMine(req: Request, res: Response) {
    if (!req.user) throw new AppError('UNAUTHORIZED', 'Debes iniciar sesión');
    res.status(200).json(await reservationsService.findMine(req.user.id));
  },

  async cancel(req: Request, res: Response) {
    if (!req.user) throw new AppError('UNAUTHORIZED', 'Debes iniciar sesión');
    const reservationId = reservationIdSchema.parse(req.params.id);
    res.status(200).json(await reservationsService.cancel(req.user.id, reservationId));
  },
};
