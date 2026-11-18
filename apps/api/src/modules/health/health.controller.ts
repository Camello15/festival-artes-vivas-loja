import type { Request, Response } from 'express';
import { healthService } from './health.service';

export const healthController = {
  async get(_req: Request, res: Response) {
    const health = await healthService.check();
    res.status(health.status === 'ok' ? 200 : 503).json(health);
  },
};
