import { prisma } from '../../lib/prisma';

export const artistsRepository = {
  async findMany(search?: string) {
    return prisma.artist.findMany({
      where: search
        ? {
            name: {
              contains: search,
            },
          }
        : undefined,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        kind: true,
        country: true,
        imageUrl: true,
      },
    });
  },

  async findById(id: number) {
    return prisma.artist.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        kind: true,
        country: true,
        bio: true,
        imageUrl: true,
        website: true,
        events: {
          orderBy: { title: 'asc' },
          select: {
            id: true,
            title: true,
            discipline: true,
          },
        },
      },
    });
  },
};

export type ArtistsRepository = typeof artistsRepository;
