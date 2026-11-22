import { z } from 'zod';
import { Discipline, enumValues } from '../../../domain/enums';

const artistIdsSchema = z.array(z.number().int().positive())
  .refine((ids) => new Set(ids).size === ids.length, 'No repitas artistas');

const eventFields = {
  title: z.string().trim().min(1, 'Ingresa el título de la obra'),
  discipline: z.enum(enumValues(Discipline)),
  synopsis: z.string().trim().min(1, 'Ingresa la sinopsis'),
  durationMinutes: z.number().int().positive('La duración debe ser un entero mayor que cero'),
  ageRating: z.string().trim().min(1, 'Ingresa la clasificación de edad'),
  imageUrl: z.union([z.string().url('Ingresa una URL válida'), z.literal(''), z.null()])
    .optional()
    .transform((value) => value === '' ? null : value),
  artistIds: artistIdsSchema,
};

export const createEventSchema = z.object(eventFields).strict();
export const updateEventSchema = z.object(eventFields).strict();
export const eventIdSchema = z.coerce.number().int().positive();

export type EventInput = z.infer<typeof createEventSchema>;
