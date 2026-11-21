import type { Request, Response } from 'express';
import { z } from 'zod';
import { venuesService } from './venues.service';

const idParamSchema = z.object({
  id: z.coerce.number().int().positive('El identificador debe ser un entero positivo'),
});

export const venuesController = {
  async list(_req: Request, res: Response) {
    const venues = await venuesService.listVenues();
    res.json(venues);
  },

  async getById(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    const venue = await venuesService.getVenueById(id);
    res.json(venue);
  },
};
