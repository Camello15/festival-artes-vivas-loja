import { AppError } from '../../../errors/AppError';
import { logAudit } from '../../../lib/auditLog';
import { adminEventsRepository, type AdminEventsRepository } from './admin-events.repository';
import type { EventInput } from './admin-events.schemas';

function isPrismaCode(error: unknown, code: string) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

export function createAdminEventsService(repository: AdminEventsRepository = adminEventsRepository) {
  return {
    list() {
      return repository.findMany();
    },

    async get(id: number) {
      const event = await repository.findById(id);
      if (!event) throw AppError.notFound('Obra no encontrada');
      return event;
    },

    async validateArtists(artistIds: number[]) {
      const artists = await repository.findExistingArtistIds(artistIds);
      if (artists.length !== artistIds.length) {
        throw new AppError('VALIDATION_ERROR', 'Uno o más artistas no existen', [
          { path: 'artistIds', message: 'Selecciona artistas existentes.' },
        ]);
      }
    },

    async create(input: EventInput, userId: number) {
      await this.validateArtists(input.artistIds);
      const event = await repository.create(input);
      logAudit({ userId, action: 'CREATE', entity: 'Event', entityId: event.id });
      return event;
    },

    async update(id: number, input: EventInput, userId: number) {
      await this.get(id);
      await this.validateArtists(input.artistIds);
      try {
        const event = await repository.update(id, input);
        logAudit({ userId, action: 'UPDATE', entity: 'Event', entityId: id });
        return event;
      } catch (error) {
        if (isPrismaCode(error, 'P2025')) {
          throw new AppError('VALIDATION_ERROR', 'Uno o más artistas ya no están disponibles', [
            { path: 'artistIds', message: 'Selecciona artistas existentes.' },
          ]);
        }
        throw error;
      }
    },

    async delete(id: number, userId: number) {
      await this.get(id);
      if (!await repository.deleteIfWithoutPerformances(id)) {
        throw AppError.conflict('No se puede eliminar una obra que tiene funciones asociadas');
      }
      logAudit({ userId, action: 'DELETE', entity: 'Event', entityId: id });
    },
  };
}

export const adminEventsService = createAdminEventsService();
