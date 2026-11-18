import { prisma } from '../../lib/prisma';
import { PerformanceStatus } from '../../domain/enums';

export interface FestivalCounts {
  events: number;
  performances: number;
  artists: number;
  venues: number;
}

export interface DateRange {
  first: Date | null;
  last: Date | null;
}

export const festivalRepository = {
  async getCounts(): Promise<FestivalCounts> {
    const [events, performances, artists, venues] = await Promise.all([
      prisma.event.count(),
      prisma.performance.count({ where: { status: PerformanceStatus.SCHEDULED } }),
      prisma.artist.count(),
      prisma.venue.count(),
    ]);
    return { events, performances, artists, venues };
  },

  async getPerformanceDateRange(): Promise<DateRange> {
    const result = await prisma.performance.aggregate({
      where: { status: PerformanceStatus.SCHEDULED },
      _min: { startsAt: true },
      _max: { startsAt: true },
    });
    return { first: result._min.startsAt, last: result._max.startsAt };
  },
};

export type FestivalRepository = typeof festivalRepository;
