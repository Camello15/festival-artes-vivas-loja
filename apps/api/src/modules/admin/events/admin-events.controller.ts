import type { Request, Response } from 'express';
import { adminEventsService } from './admin-events.service';
import { createEventSchema, eventIdSchema, updateEventSchema } from './admin-events.schemas';

export const adminEventsController = {
  async list(_req: Request, res: Response) {
    res.status(200).json(await adminEventsService.list());
  },

  async get(req: Request, res: Response) {
    const id = eventIdSchema.parse(req.params.id);
    res.status(200).json(await adminEventsService.get(id));
  },

  async create(req: Request, res: Response) {
    const input = createEventSchema.parse(req.body);
    res.status(201).json(await adminEventsService.create(input));
  },

  async update(req: Request, res: Response) {
    const id = eventIdSchema.parse(req.params.id);
    const input = updateEventSchema.parse(req.body);
    res.status(200).json(await adminEventsService.update(id, input));
  },

  async delete(req: Request, res: Response) {
    const id = eventIdSchema.parse(req.params.id);
    await adminEventsService.delete(id);
    res.sendStatus(204);
  },
};
