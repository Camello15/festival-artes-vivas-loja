import { prisma } from '../../../lib/prisma';

export const adminVenuesRepository = {
  findMany() {
    return prisma.venue.findMany({ orderBy: { name: 'asc' } });
  },

  findById(id: number) {
    return prisma.venue.findUnique({ where: { id } });
  },

  create(data: Parameters<typeof prisma.venue.create>[0]['data']) {
    return prisma.venue.create({ data });
  },

  update(id: number, data: Parameters<typeof prisma.venue.update>[0]['data']) {
    return prisma.venue.update({ where: { id }, data });
  },

  async countPerformances(id: number) {
    return prisma.performance.count({ where: { venueId: id } });
  },

  delete(id: number) {
    return prisma.venue.delete({ where: { id } });
  },
};

export type AdminVenuesRepository = typeof adminVenuesRepository;
