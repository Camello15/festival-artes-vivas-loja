import type { Request, Response } from 'express';
import { z } from 'zod';
import { artistsService } from './artists.service';

const listQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive('El identificador debe ser un entero positivo'),
});

export const artistsController = {
  async list(req: Request, res: Response) {
    const { search } = listQuerySchema.parse(req.query);
    const artists = await artistsService.listArtists(search);
    res.json(artists);
  },

  async getById(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    const artist = await artistsService.getArtistById(id);
    res.json(artist);
  },
};
