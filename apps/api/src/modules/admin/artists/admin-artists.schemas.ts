import { z } from 'zod';
import { ArtistKind } from '../../../domain/enums';
import { enumValues } from '../../../domain/enums';

const artistFields = {
  name: z.string().trim().min(1, 'Ingresa el nombre del artista o compañía'),
  kind: z.enum(enumValues(ArtistKind)),
  country: z.string().trim().min(1, 'Ingresa el país de origen'),
  bio: z.string().trim().default(''),
  imageUrl: z.union([z.string().url('Ingresa una URL válida'), z.literal(''), z.null()])
    .optional()
    .transform((value) => value === '' ? null : value),
  website: z.union([z.string().url('Ingresa una URL válida'), z.literal(''), z.null()])
    .optional()
    .transform((value) => value === '' ? null : value),
};

export const createArtistSchema = z.object(artistFields).strict();
export const updateArtistSchema = z.object(artistFields).strict();
export const artistIdSchema = z.coerce.number().int().positive();

export type ArtistInput = z.infer<typeof createArtistSchema>;
