import type { Request, Response } from 'express';
import { z } from 'zod';
import { eventsService } from './events.service';

const idParamSchema = z.object({
  id: z.coerce.number().int().positive('El identificador debe ser un entero positivo'),
});

export const eventsController = {
  async getById(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    const event = await eventsService.getEventById(id);
    res.json(event);
  },
};
