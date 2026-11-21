import { randomInt } from 'node:crypto';
import { PerformanceStatus, ReservationStatus } from '../../domain/enums';
import { AppError } from '../../errors/AppError';
import { ensureSqliteBusyTimeout, prisma } from '../../lib/prisma';
import {
  reservationsRepository,
  type ReservationsPrismaClient,
  type ReservationsRepository,
} from './reservations.repository';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_COLLISION_ATTEMPTS = 5;
const TRANSACTION_MAX_WAIT_MS = 30_000;
const TRANSACTION_TIMEOUT_MS = 30_000;

function generateReservationCode() {
  let suffix = '';
  for (let index = 0; index < 6; index += 1) {
    suffix += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return `FAV-${suffix}`;
}

function isPrismaCode(error: unknown, code: string) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

export function createReservationsService(
  client: ReservationsPrismaClient = prisma,
  repository: ReservationsRepository = reservationsRepository,
  now: () => Date = () => new Date(),
  createCode: () => string = generateReservationCode,
  prepareSqlite: () => Promise<unknown> = ensureSqliteBusyTimeout,
) {
  async function reserveOnce(userId: number, performanceId: number, quantity: number) {
    return client.$transaction(
      async (tx) => {
        // La primera operación dentro de la transacción escribe y toma el bloqueo SQLite.
        const reservation = await repository.create(tx, {
          code: createCode(),
          userId,
          performanceId,
          quantity,
          status: ReservationStatus.CONFIRMED,
        });

        const performance = await repository.findPerformance(tx, performanceId);
        if (!performance) throw AppError.notFound('Función no encontrada');
        if (performance.status === PerformanceStatus.CANCELLED) {
          throw AppError.conflict('La función está cancelada y no admite reservas');
        }
        if (performance.status !== PerformanceStatus.SCHEDULED) {
          throw AppError.conflict('La función no está disponible para reservas');
        }
        if (performance.startsAt.getTime() <= now().getTime()) {
          throw AppError.conflict('La función ya inició y no admite reservas');
        }

        const reserved = await repository.sumConfirmed(tx, performanceId);
        const availableBeforeReservation = Math.max(0, performance.capacity - (reserved - quantity));
        if (reserved > performance.capacity) {
          throw AppError.conflict(`Solo quedan ${availableBeforeReservation} entradas`);
        }

        const reservedByUser = await repository.sumConfirmed(tx, performanceId, userId);
        if (reservedByUser > 6) {
          throw AppError.conflict('Máximo 6 entradas por persona y función');
        }

        return reservation;
      },
      { maxWait: TRANSACTION_MAX_WAIT_MS, timeout: TRANSACTION_TIMEOUT_MS },
    );
  }

  return {
    async reserve(userId: number, performanceId: number, quantity: number) {
      await prepareSqlite();

      for (let attempt = 0; attempt < CODE_COLLISION_ATTEMPTS; attempt += 1) {
        try {
          return await reserveOnce(userId, performanceId, quantity);
        } catch (error) {
          if (isPrismaCode(error, 'P2003')) {
            throw AppError.notFound('Función no encontrada');
          }
          // Reservation.code tiene el único índice único que puede colisionar aquí.
          if (!isPrismaCode(error, 'P2002')) throw error;
        }
      }

      throw AppError.conflict('No se pudo generar un código único para la reserva');
    },

    async findMine(userId: number) {
      return repository.findByUser(userId);
    },

    async cancel(userId: number, reservationId: number) {
      await prepareSqlite();
      return client.$transaction(
        async (tx) => {
          const reservation = await repository.findByIdForUser(tx, reservationId, userId);
          if (!reservation) throw AppError.notFound('Reserva no encontrada');
          if (reservation.status === ReservationStatus.CANCELLED) return reservation;
          if (reservation.performance.startsAt.getTime() <= now().getTime()) {
            throw AppError.conflict('No se puede cancelar una reserva de una función que ya inició');
          }
          return repository.markCancelled(tx, reservationId, userId);
        },
        { maxWait: TRANSACTION_MAX_WAIT_MS, timeout: TRANSACTION_TIMEOUT_MS },
      );
    },
  };
}

export const reservationsService = createReservationsService();
