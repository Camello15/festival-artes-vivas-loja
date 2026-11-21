import { z } from 'zod';

const venueFields = {
  name: z.string().trim().min(1, 'Ingresa el nombre del escenario'),
  address: z.string().trim().min(1, 'Ingresa la dirección del escenario'),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  capacity: z.number().int().positive('El aforo debe ser un entero mayor que cero'),
  description: z.string().trim().default(''),
  imageUrl: z.union([z.string().url('Ingresa una URL válida'), z.literal(''), z.null()])
    .optional()
    .transform((value) => value === '' ? null : value),
};

export const createVenueSchema = z.object(venueFields).strict();
export const updateVenueSchema = z.object(venueFields).strict();
export const venueIdSchema = z.coerce.number().int().positive();

export type VenueInput = z.infer<typeof createVenueSchema>;
