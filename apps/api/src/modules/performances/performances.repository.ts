import type { Prisma } from '@prisma/client';
import { ReservationStatus } from '../../domain/enums';
import { prisma } from '../../lib/prisma';

export interface PerformanceDbFilters {
  startsAtGte?: Date;
  startsAtLt?: Date;
  discipline?: string;
  venueId?: number;
}

export const performancesRepository = {
  async findMany(filters: PerformanceDbFilters = {}) {
    const where: Prisma.PerformanceWhereInput = {};

    if (filters.startsAtGte || filters.startsAtLt) {
      where.startsAt = {
        ...(filters.startsAtGte ? { gte: filters.startsAtGte } : {}),
        ...(filters.startsAtLt ? { lt: filters.startsAtLt } : {}),
      };
    }

    if (filters.discipline) {
      where.event = { discipline: filters.discipline };
    }

    if (filters.venueId !== undefined) {
      where.venueId = filters.venueId;
    }

    return prisma.performance.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            discipline: true,
            durationMinutes: true,
            imageUrl: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  async findFilterOptions(now: Date) {
    const [performances, venues] = await Promise.all([
      prisma.performance.findMany({
        where: { startsAt: { gte: now } },
        orderBy: { startsAt: 'asc' },
        select: {
          startsAt: true,
          event: { select: { discipline: true } },
        },
      }),
      prisma.venue.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
    ]);

    return { performances, venues };
  },

  /**
   * Calcula asientos reservados (CONFIRMED) por función en una sola consulta (evita N+1).
   * Reutilizado por el Spec #3 al validar reservas.
   */
  async getReservedSeatsByPerformance(performanceIds: number[]) {
    const result = new Map<number, number>();
    if (performanceIds.length === 0) return result;

    const grouped = await prisma.reservation.groupBy({
      by: ['performanceId'],
      where: {
        performanceId: { in: performanceIds },
        status: ReservationStatus.CONFIRMED,
      },
      _sum: { quantity: true },
    });

    for (const row of grouped) {
      result.set(row.performanceId, row._sum.quantity ?? 0);
    }

    return result;
  },
};

export type PerformancesRepository = typeof performancesRepository;
