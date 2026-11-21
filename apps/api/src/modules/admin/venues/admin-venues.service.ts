import { AppError } from '../../../errors/AppError';
import { adminVenuesRepository, type AdminVenuesRepository } from './admin-venues.repository';
import type { VenueInput } from './admin-venues.schemas';

function isPrismaCode(error: unknown, code: string) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

export function createAdminVenuesService(repository: AdminVenuesRepository = adminVenuesRepository) {
  return {
    list() {
      return repository.findMany();
    },

    async get(id: number) {
      const venue = await repository.findById(id);
      if (!venue) throw AppError.notFound('Escenario no encontrado');
      return venue;
    },

    create(data: VenueInput) {
      return repository.create(data);
    },

    async update(id: number, data: VenueInput) {
      await this.get(id);
      return repository.update(id, data);
    },

    async delete(id: number) {
      await this.get(id);
      if (await repository.countPerformances(id) > 0) {
        throw AppError.conflict('No se puede eliminar un escenario que tiene funciones asociadas');
      }

      try {
        await repository.delete(id);
      } catch (error) {
        // La FK Restrict protege también frente a una función creada concurrentemente.
        if (isPrismaCode(error, 'P2003')) {
          throw AppError.conflict('No se puede eliminar un escenario que tiene funciones asociadas');
        }
        throw error;
      }
    },
  };
}

export const adminVenuesService = createAdminVenuesService();
