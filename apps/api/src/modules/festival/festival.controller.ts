import type { Request, Response } from 'express';
import { festivalService } from './festival.service';

export const festivalController = {
  async getSummary(_req: Request, res: Response) {
    res.json(await festivalService.getSummary());
  },
};
