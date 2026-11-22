import { prisma } from '../../lib/prisma';

export const artistAgendaRepository = {
  findPerformancesForUser(userId: number) {
    return prisma.performance.findMany({
      where: { event: { artists: { some: { userId } } } },
      orderBy: { startsAt: 'asc' },
      select: {
        id: true,
        startsAt: true,
        status: true,
        capacity: true,
        event: {
          select: { id: true, title: true, discipline: true, durationMinutes: true, imageUrl: true },
        },
        venue: { select: { id: true, name: true } },
      },
    });
  },
};

export type ArtistAgendaRepository = typeof artistAgendaRepository;
