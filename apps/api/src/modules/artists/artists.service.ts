import { AppError } from '../../errors/AppError';
import { artistsRepository, type ArtistsRepository } from './artists.repository';

export function createArtistsService(repository: ArtistsRepository = artistsRepository) {
  return {
    async listArtists(search?: string) {
      const normalized = search?.trim();
      return repository.findMany(normalized ? normalized : undefined);
    },

    async getArtistById(id: number) {
      const artist = await repository.findById(id);
      if (!artist) {
        throw AppError.notFound('Artista no encontrado');
      }
      return artist;
    },
  };
}

export const artistsService = createArtistsService();
