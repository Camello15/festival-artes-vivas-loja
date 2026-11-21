import { AppError } from '../../../errors/AppError';
import { adminArtistsRepository, type AdminArtistsRepository } from './admin-artists.repository';
import type { ArtistInput } from './admin-artists.schemas';

function isPrismaCode(error: unknown, code: string) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

export function createAdminArtistsService(repository: AdminArtistsRepository = adminArtistsRepository) {
  return {
    list() {
      return repository.findMany();
    },

    async get(id: number) {
      const artist = await repository.findById(id);
      if (!artist) throw AppError.notFound('Artista no encontrado');
      return artist;
    },

    create(data: ArtistInput) {
      return repository.create(data);
    },

    async update(id: number, data: ArtistInput) {
      await this.get(id);
      return repository.update(id, data);
    },

    async delete(id: number) {
      await this.get(id);
      if (await repository.countEvents(id) > 0) {
        throw AppError.conflict('No se puede eliminar un artista que tiene obras asociadas');
      }

      try {
        await repository.delete(id);
      } catch (error) {
        // La relación implícita de Prisma también puede rechazar un vínculo concurrente.
        if (isPrismaCode(error, 'P2003')) {
          throw AppError.conflict('No se puede eliminar un artista que tiene obras asociadas');
        }
        throw error;
      }
    },
  };
}

export const adminArtistsService = createAdminArtistsService();
