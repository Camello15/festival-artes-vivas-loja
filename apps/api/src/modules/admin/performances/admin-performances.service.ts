import { PerformanceStatus } from '../../../domain/enums';
import { AppError } from '../../../errors/AppError';
import { logAudit } from '../../../lib/auditLog';
import { ensureSqliteBusyTimeout } from '../../../lib/prisma';
import { performancesRepository } from '../../performances/performances.repository';
import {
  adminPerformancesRepository,
  type AdminPerformancesRepository,
} from './admin-performances.repository';
import type { PerformanceInput } from './admin-performances.schemas';

function fieldError(path: string, message: string) {
  return new AppError('VALIDATION_ERROR', message, [{ path, message }]);
}

export function createAdminPerformancesService(
  repository: AdminPerformancesRepository = adminPerformancesRepository,
  now: () => Date = () => new Date(),
  prepareSqlite: () => Promise<unknown> = ensureSqliteBusyTimeout,
) {
  async function validateReferences(tx: Parameters<Parameters<AdminPerformancesRepository['transaction']>[0]>[0], input: PerformanceInput) {
    const [event, venue] = await Promise.all([
      repository.findEvent(tx, input.eventId),
      repository.findVenue(tx, input.venueId),
    ]);
    if (!event) throw AppError.notFound('Obra no encontrada');
    if (!venue) throw AppError.notFound('Escenario no encontrado');
    if (input.capacity > venue.capacity) {
      throw fieldError('capacity', 'El aforo de la función no puede superar la capacidad del escenario.');
    }
    if (input.status === PerformanceStatus.SCHEDULED && input.startsAt.getTime() <= now().getTime()) {
      throw fieldError('startsAt', 'La función debe programarse para una fecha futura.');
    }
    return venue;
  }

  async function withReservedSeats<T extends { id: number; status: string }>(performance: T) {
    const reservedMap = await performancesRepository.getReservedSeatsByPerformance([performance.id]);
    return { ...performance, reservedSeats: reservedMap.get(performance.id) ?? 0 };
  }

  return {
    async list() {
      const rows = await repository.findMany();
      const reservedMap = await performancesRepository.getReservedSeatsByPerformance(rows.map((row) => row.id));
      return rows.map((row) => ({ ...row, reservedSeats: reservedMap.get(row.id) ?? 0 }));
    },

    async get(id: number) {
      const performance = await repository.findById(id);
      if (!performance) throw AppError.notFound('Función no encontrada');
      return withReservedSeats(performance);
    },

    async create(input: PerformanceInput, userId: number) {
      await prepareSqlite();
      const created = await repository.transaction(async (tx) => {
        await validateReferences(tx, input);
        return repository.create(tx, input);
      });
      logAudit({ userId, action: 'CREATE', entity: 'Performance', entityId: created.id });
      return withReservedSeats(created);
    },

    async update(id: number, input: PerformanceInput, userId: number) {
      await prepareSqlite();
      const updated = await repository.transaction(async (tx) => {
        const current = await repository.findInTransaction(tx, id);
        if (!current) throw AppError.notFound('Función no encontrada');
        await validateReferences(tx, input);
        if (input.status === PerformanceStatus.CANCELLED
          && current.status !== PerformanceStatus.CANCELLED
          && current.startsAt.getTime() <= now().getTime()) {
          throw AppError.conflict('No se puede cancelar una función que ya inició');
        }

        // La escritura toma el bloqueo SQLite antes de leer el total reservado.
        const result = await repository.update(tx, id, input);
        const reservedSeats = await repository.sumConfirmedSeats(tx, id);
        if (input.capacity < reservedSeats) {
          throw AppError.conflict(`El aforo no puede ser menor que las ${reservedSeats} entradas confirmadas`);
        }
        if (input.status === PerformanceStatus.CANCELLED) {
          await repository.cancelConfirmedReservations(tx, id);
        }
        return { performance: result, cancelled: input.status === PerformanceStatus.CANCELLED
          && current.status !== PerformanceStatus.CANCELLED };
      });
      logAudit({
        userId,
        action: updated.cancelled ? 'CANCEL' : 'UPDATE',
        entity: 'Performance',
        entityId: id,
      });
      return withReservedSeats(updated.performance);
    },

    async cancel(id: number, userId: number) {
      await prepareSqlite();
      const result = await repository.transaction(async (tx) => {
        const current = await repository.findInTransaction(tx, id);
        if (!current) throw AppError.notFound('Función no encontrada');
        if (current.status === PerformanceStatus.SCHEDULED && current.startsAt.getTime() <= now().getTime()) {
          throw AppError.conflict('No se puede cancelar una función que ya inició');
        }
        const performance = await repository.updateStatus(tx, id, PerformanceStatus.CANCELLED);
        const cancellation = await repository.cancelConfirmedReservations(tx, id);
        return { performance, cancelledReservations: cancellation.count };
      });
      logAudit({ userId, action: 'CANCEL', entity: 'Performance', entityId: id });
      return { ...result, performance: await withReservedSeats(result.performance) };
    },

    async listReservations(id: number) {
      await this.get(id);
      const result = await repository.getReservations(id);
      return { performanceId: id, ...result };
    },

    async delete(id: number, userId: number) {
      await this.get(id);
      const result = await repository.deleteIfWithoutReservations(id);
      if (result === 'missing') throw AppError.notFound('Función no encontrada');
      if (result === 'has-reservations') {
        throw AppError.conflict('No se puede eliminar una función que tiene reservas; cancélala para conservar su historial');
      }
      logAudit({ userId, action: 'DELETE', entity: 'Performance', entityId: id });
    },
  };
}

export const adminPerformancesService = createAdminPerformancesService();
