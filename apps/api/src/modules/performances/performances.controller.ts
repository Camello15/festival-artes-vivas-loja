import type { Request, Response } from 'express';
import { performanceQuerySchema } from './performances.schemas';
import { performancesService } from './performances.service';

export const performancesController = {
  async list(req: Request, res: Response) {
    const query = performanceQuerySchema.parse(req.query);
    const items = await performancesService.listPerformances(query);
    res.json(items);
  },

  async filters(_req: Request, res: Response) {
    const options = await performancesService.getFilterOptions();
    res.json(options);
  },
};
