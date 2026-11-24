import { prisma } from '../../lib/prisma';

export const eventsRepository = {
  async findById(id: number) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        artists: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            kind: true,
            country: true,
            imageUrl: true,
          },
        },
        performances: {
          orderBy: { startsAt: 'asc' },
          include: {
            venue: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  },
};

export type EventsRepository = typeof eventsRepository;
