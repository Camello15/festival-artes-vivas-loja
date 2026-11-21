import type { Prisma } from '@prisma/client';
import { ReservationStatus } from '../../../domain/enums';
import { prisma } from '../../../lib/prisma';
import type { PerformanceInput } from './admin-performances.schemas';

export type PerformanceTransaction = Prisma.TransactionClient;

const performanceInclude = {
  event: { select: { id: true, title: true, discipline: true } },
  venue: { select: { id: true, name: true, capacity: true } },
  _count: { select: { reservations: true } },
};

export const adminPerformancesRepository = {
  transaction<T>(operation: (tx: PerformanceTransaction) => Promise<T>) {
    return prisma.$transaction(operation, { maxWait: 30_000, timeout: 30_000 });
  },

  findMany() {
    return prisma.performance.findMany({
      orderBy: { startsAt: 'asc' },
      include: performanceInclude,
    });
  },

  findById(id: number) {
    return prisma.performance.findUnique({ where: { id }, include: performanceInclude });
  },

  findInTransaction(tx: PerformanceTransaction, id: number) {
    return tx.performance.findUnique({ where: { id } });
  },

  findEvent(tx: PerformanceTransaction, id: number) {
    return tx.event.findUnique({ where: { id }, select: { id: true } });
  },

  findVenue(tx: PerformanceTransaction, id: number) {
    return tx.venue.findUnique({ where: { id }, select: { id: true, capacity: true } });
  },

  create(tx: PerformanceTransaction, data: PerformanceInput) {
    return tx.performance.create({ data, include: performanceInclude });
  },

  update(tx: PerformanceTransaction, id: number, data: PerformanceInput) {
    return tx.performance.update({ where: { id }, data, include: performanceInclude });
  },

  updateStatus(tx: PerformanceTransaction, id: number, status: string) {
    return tx.performance.update({ where: { id }, data: { status }, include: performanceInclude });
  },

  sumConfirmedSeats(tx: PerformanceTransaction, performanceId: number) {
    return tx.reservation.aggregate({
      where: { performanceId, status: ReservationStatus.CONFIRMED },
      _sum: { quantity: true },
    }).then((result) => result._sum.quantity ?? 0);
  },

  cancelConfirmedReservations(tx: PerformanceTransaction, performanceId: number) {
    return tx.reservation.updateMany({
      where: { performanceId, status: ReservationStatus.CONFIRMED },
      data: { status: ReservationStatus.CANCELLED },
    });
  },

  async getReservations(performanceId: number) {
    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where: { performanceId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          code: true,
          quantity: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.reservation.aggregate({
        where: { performanceId, status: ReservationStatus.CONFIRMED },
        _sum: { quantity: true },
      }),
    ]);
    return { reservations, totalConfirmed: total._sum.quantity ?? 0 };
  },

  deleteIfWithoutReservations(id: number) {
    return prisma.$transaction(async (tx) => {
      const performance = await tx.performance.findUnique({ where: { id }, select: { id: true, status: true } });
      if (!performance) return 'missing' as const;

      // Adquiere el bloqueo de escritura antes de comprobar dependencias para evitar borrar
      // reservas que se creen concurrentemente mientras corre este DELETE.
      await tx.performance.update({ where: { id }, data: { status: performance.status } });
      const reservationCount = await tx.reservation.count({ where: { performanceId: id } });
      if (reservationCount > 0) return 'has-reservations' as const;

      await tx.performance.delete({ where: { id } });
      return 'deleted' as const;
    }, { maxWait: 30_000, timeout: 30_000 });
  },
};

export type AdminPerformancesRepository = typeof adminPerformancesRepository;
