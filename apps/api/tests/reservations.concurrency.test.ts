import { afterAll, describe, expect, it } from 'vitest';
import { AppError } from '../src/errors/AppError';
import { prisma } from '../src/lib/prisma';
import { createReservationsService } from '../src/modules/reservations/reservations.service';

const service = createReservationsService();
const runId = `concurrency-${Date.now()}`;

afterAll(async () => {
  await prisma.$disconnect();
}, 30_000);

describe('reservationsService concurrency with SQLite', () => {
  it('confirma exactamente diez de veinte reservas concurrentes sobre diez cupos', async () => {
    const event = await prisma.event.findFirstOrThrow();
    const venue = await prisma.venue.findFirstOrThrow();
    const users = [];

    for (let index = 0; index < 20; index += 1) {
      users.push(
        await prisma.user.create({
          data: {
            name: `Concurrente ${index}`,
            email: `${runId}-${index}@festival.ec`,
            passwordHash: 'unused-in-this-test',
            role: 'PUBLIC',
          },
        }),
      );
    }

    const performance = await prisma.performance.create({
      data: {
        eventId: event.id,
        venueId: venue.id,
        startsAt: new Date(Date.now() + 60 * 60 * 1000),
        capacity: 10,
      },
    });

    try {
      const results = await Promise.allSettled(users.map((user) => service.reserve(user.id, performance.id, 1)));
      const fulfilled = results.filter((result) => result.status === 'fulfilled');
      const rejected = results.filter((result) => result.status === 'rejected');
      const confirmed = await prisma.reservation.aggregate({
        where: { performanceId: performance.id, status: 'CONFIRMED' },
        _sum: { quantity: true },
        _count: { _all: true },
      });

      expect(fulfilled).toHaveLength(10);
      expect(rejected).toHaveLength(10);
      expect(
        rejected.every(
          (result) => result.status === 'rejected' && result.reason instanceof AppError && result.reason.code === 'CONFLICT',
        ),
      ).toBe(true);
      expect(confirmed._count._all).toBe(10);
      expect(confirmed._sum.quantity).toBe(10);
      expect(confirmed._sum.quantity).toBeLessThanOrEqual(performance.capacity);
    } finally {
      await prisma.reservation.deleteMany({ where: { performanceId: performance.id } });
      await prisma.performance.delete({ where: { id: performance.id } });
      await prisma.user.deleteMany({ where: { email: { startsWith: runId } } });
    }
  }, 30_000);
});
