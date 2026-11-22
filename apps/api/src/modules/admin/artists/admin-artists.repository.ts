import { prisma } from '../../../lib/prisma';

export const adminArtistsRepository = {
  findMany() {
    return prisma.artist.findMany({ orderBy: { name: 'asc' } });
  },

  findById(id: number) {
    return prisma.artist.findUnique({ where: { id } });
  },

  create(data: Parameters<typeof prisma.artist.create>[0]['data']) {
    return prisma.artist.create({ data });
  },

  update(id: number, data: Parameters<typeof prisma.artist.update>[0]['data']) {
    return prisma.artist.update({ where: { id }, data });
  },

  countEvents(id: number) {
    return prisma.event.count({ where: { artists: { some: { id } } } });
  },

  delete(id: number) {
    return prisma.artist.delete({ where: { id } });
  },
};

export type AdminArtistsRepository = typeof adminArtistsRepository;
