import type { Request, Response } from 'express';
import { adminVenuesService } from './admin-venues.service';
import { createVenueSchema, updateVenueSchema, venueIdSchema } from './admin-venues.schemas';

export const adminVenuesController = {
  async list(_req: Request, res: Response) {
    res.status(200).json(await adminVenuesService.list());
  },

  async get(req: Request, res: Response) {
    const id = venueIdSchema.parse(req.params.id);
    res.status(200).json(await adminVenuesService.get(id));
  },

  async create(req: Request, res: Response) {
    const input = createVenueSchema.parse(req.body);
    const venue = await adminVenuesService.create(input, req.user!.id);
    res.status(201).json(venue);
  },

  async update(req: Request, res: Response) {
    const id = venueIdSchema.parse(req.params.id);
    const input = updateVenueSchema.parse(req.body);
    res.status(200).json(await adminVenuesService.update(id, input, req.user!.id));
  },

  async delete(req: Request, res: Response) {
    const id = venueIdSchema.parse(req.params.id);
    await adminVenuesService.delete(id, req.user!.id);
    res.sendStatus(204);
  },
};
