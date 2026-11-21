import { prisma } from '../../lib/prisma';

export const venuesRepository = {
  async findMany() {
    return prisma.venue.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        address: true,
        capacity: true,
        latitude: true,
        longitude: true,
        imageUrl: true,
      },
    });
  },

  async findByIdWithUpcoming(id: number, now: Date) {
    return prisma.venue.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        address: true,
        capacity: true,
        latitude: true,
        longitude: true,
        description: true,
        imageUrl: true,
        performances: {
          where: {
            startsAt: { gte: now },
          },
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
          },
        },
      },
    });
  },
};

export type VenuesRepository = typeof venuesRepository;
