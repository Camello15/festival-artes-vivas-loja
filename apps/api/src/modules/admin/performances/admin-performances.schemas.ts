import { z } from 'zod';
import { PerformanceStatus, enumValues } from '../../../domain/enums';

const performanceFields = {
  eventId: z.number().int().positive('Selecciona una obra válida'),
  venueId: z.number().int().positive('Selecciona un escenario válido'),
  startsAt: z.string().datetime({ offset: true, message: 'Ingresa una fecha y hora válidas' })
    .transform((value) => new Date(value)),
  capacity: z.number().int().positive('El aforo debe ser un entero mayor que cero'),
  status: z.enum(enumValues(PerformanceStatus)),
};

export const createPerformanceSchema = z.object(performanceFields).strict();
export const updatePerformanceSchema = z.object(performanceFields).strict();
export const performanceIdSchema = z.coerce.number().int().positive();

export type PerformanceInput = z.infer<typeof createPerformanceSchema>;
