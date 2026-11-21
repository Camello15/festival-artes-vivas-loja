import { prisma } from '../../../lib/prisma';
import type { EventInput } from './admin-events.schemas';

const artistSummary = {
  orderBy: { name: 'asc' as const },
  select: { id: true, name: true, kind: true, country: true },
};

export const adminEventsRepository = {
  findMany() {
    return prisma.event.findMany({ orderBy: { title: 'asc' }, include: { artists: artistSummary } });
  },

  findById(id: number) {
    return prisma.event.findUnique({ where: { id }, include: { artists: artistSummary } });
  },

  findExistingArtistIds(ids: number[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return prisma.artist.findMany({ where: { id: { in: ids } }, select: { id: true } });
  },

  create(input: EventInput) {
    const { artistIds, ...data } = input;
    return prisma.event.create({
      data: { ...data, artists: { connect: artistIds.map((id) => ({ id })) } },
      include: { artists: artistSummary },
    });
  },

  update(id: number, input: EventInput) {
    const { artistIds, ...data } = input;
    return prisma.event.update({
      where: { id },
      data: { ...data, artists: { set: artistIds.map((artistId) => ({ id: artistId })) } },
      include: { artists: artistSummary },
    });
  },

  deleteIfWithoutPerformances(id: number) {
    return prisma.$transaction(async (tx) => {
      const performances = await tx.performance.count({ where: { eventId: id } });
      if (performances > 0) return false;
      await tx.event.delete({ where: { id } });
      return true;
    });
  },
};

export type AdminEventsRepository = typeof adminEventsRepository;
