import type { Request, Response } from 'express';
import { adminPerformancesService } from './admin-performances.service';
import { createPerformanceSchema, performanceIdSchema, updatePerformanceSchema } from './admin-performances.schemas';

export const adminPerformancesController = {
  async list(_req: Request, res: Response) {
    res.status(200).json(await adminPerformancesService.list());
  },

  async get(req: Request, res: Response) {
    const id = performanceIdSchema.parse(req.params.id);
    res.status(200).json(await adminPerformancesService.get(id));
  },

  async create(req: Request, res: Response) {
    const input = createPerformanceSchema.parse(req.body);
    res.status(201).json(await adminPerformancesService.create(input, req.user!.id));
  },

  async update(req: Request, res: Response) {
    const id = performanceIdSchema.parse(req.params.id);
    const input = updatePerformanceSchema.parse(req.body);
    res.status(200).json(await adminPerformancesService.update(id, input, req.user!.id));
  },

  async cancel(req: Request, res: Response) {
    const id = performanceIdSchema.parse(req.params.id);
    res.status(200).json(await adminPerformancesService.cancel(id, req.user!.id));
  },

  async listReservations(req: Request, res: Response) {
    const id = performanceIdSchema.parse(req.params.id);
    res.status(200).json(await adminPerformancesService.listReservations(id));
  },

  async delete(req: Request, res: Response) {
    const id = performanceIdSchema.parse(req.params.id);
    await adminPerformancesService.delete(id, req.user!.id);
    res.sendStatus(204);
  },
};
