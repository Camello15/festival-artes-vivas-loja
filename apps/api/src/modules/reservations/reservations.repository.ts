import type { Prisma, PrismaClient } from '@prisma/client';
import { ReservationStatus } from '../../domain/enums';
import { prisma } from '../../lib/prisma';

export type ReservationTransaction = Prisma.TransactionClient;

const reservationDetailsSelect = {
  id: true,
  code: true,
  quantity: true,
  status: true,
  createdAt: true,
  performance: {
    select: {
      id: true,
      startsAt: true,
      capacity: true,
      status: true,
      event: { select: { id: true, title: true, discipline: true, durationMinutes: true, imageUrl: true } },
      venue: { select: { id: true, name: true, address: true } },
    },
  },
} satisfies Prisma.ReservationSelect;

export const reservationsRepository = {
  create(tx: ReservationTransaction, data: Prisma.ReservationUncheckedCreateInput) {
    return tx.reservation.create({
      data,
      select: {
        id: true,
        code: true,
        quantity: true,
        status: true,
        performance: {
          include: { event: true, venue: true },
        },
      },
    });
  },

  sumConfirmed(tx: ReservationTransaction, performanceId: number, userId?: number) {
    return tx.reservation
      .aggregate({
        where: {
          performanceId,
          status: ReservationStatus.CONFIRMED,
          ...(userId === undefined ? {} : { userId }),
        },
        _sum: { quantity: true },
      })
      .then((result) => result._sum.quantity ?? 0);
  },

  findPerformance(tx: ReservationTransaction, performanceId: number) {
    return tx.performance.findUnique({
      where: { id: performanceId },
      select: { id: true, startsAt: true, status: true, capacity: true },
    });
  },

  findByUser(userId: number) {
    return prisma.reservation.findMany({
      where: { userId },
      orderBy: { performance: { startsAt: 'asc' } },
      select: reservationDetailsSelect,
    });
  },

  findByIdForUser(tx: ReservationTransaction, id: number, userId: number) {
    return tx.reservation.findFirst({
      where: { id, userId },
      select: reservationDetailsSelect,
    });
  },

  markCancelled(tx: ReservationTransaction, id: number, userId: number) {
    return tx.reservation.update({
      where: { id, userId },
      data: { status: ReservationStatus.CANCELLED },
      select: reservationDetailsSelect,
    });
  },
};

export type ReservationsRepository = typeof reservationsRepository;
export type ReservationsPrismaClient = Pick<PrismaClient, '$transaction'>;
