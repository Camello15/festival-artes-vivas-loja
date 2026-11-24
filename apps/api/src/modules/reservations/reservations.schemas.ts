import { z } from 'zod';

export const reserveSchema = z
  .object({
    performanceId: z.number().int().positive(),
    quantity: z.number().int().min(1).max(6),
  })
  .strict();

export type ReserveInput = z.infer<typeof reserveSchema>;
