import type { Request, Response } from 'express';
import { adminArtistsService } from './admin-artists.service';
import { artistIdSchema, createArtistSchema, updateArtistSchema } from './admin-artists.schemas';

export const adminArtistsController = {
  async list(_req: Request, res: Response) {
    res.status(200).json(await adminArtistsService.list());
  },

  async get(req: Request, res: Response) {
    const id = artistIdSchema.parse(req.params.id);
    res.status(200).json(await adminArtistsService.get(id));
  },

  async create(req: Request, res: Response) {
    const input = createArtistSchema.parse(req.body);
    const artist = await adminArtistsService.create(input);
    res.status(201).json(artist);
  },

  async update(req: Request, res: Response) {
    const id = artistIdSchema.parse(req.params.id);
    const input = updateArtistSchema.parse(req.body);
    res.status(200).json(await adminArtistsService.update(id, input));
  },

  async delete(req: Request, res: Response) {
    const id = artistIdSchema.parse(req.params.id);
    await adminArtistsService.delete(id);
    res.sendStatus(204);
  },
};
