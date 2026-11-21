import { z } from 'zod';
import { Discipline, enumValues } from '../../domain/enums';

export const performanceQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD')
    .refine((val) => {
      const parsed = new Date(`${val}T00:00:00.000Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(val);
    }, 'La fecha proporcionada no es válida')
    .optional(),
  discipline: z.enum(enumValues(Discipline)).optional(),
  venueId: z.coerce.number().int().positive('El escenario debe ser un entero positivo').optional(),
  includePast: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export type PerformanceQueryInput = z.infer<typeof performanceQuerySchema>;
