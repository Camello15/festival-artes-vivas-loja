import { AppError } from '../../../errors/AppError';
import { logAudit } from '../../../lib/auditLog';
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

    async create(data: VenueInput, userId: number) {
      const venue = await repository.create(data);
      logAudit({ userId, action: 'CREATE', entity: 'Venue', entityId: venue.id });
      return venue;
    },

    async update(id: number, data: VenueInput, userId: number) {
      await this.get(id);
      const venue = await repository.update(id, data);
      logAudit({ userId, action: 'UPDATE', entity: 'Venue', entityId: id });
      return venue;
    },

    async delete(id: number, userId: number) {
      await this.get(id);
      if (await repository.countPerformances(id) > 0) {
        throw AppError.conflict('No se puede eliminar un escenario que tiene funciones asociadas');
      }

      try {
        await repository.delete(id);
        logAudit({ userId, action: 'DELETE', entity: 'Venue', entityId: id });
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
