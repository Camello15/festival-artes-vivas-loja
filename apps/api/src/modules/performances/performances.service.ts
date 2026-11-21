import { Discipline, enumValues } from '../../domain/enums';
import { computeAvailability, type AvailabilityStatus } from './availability';
import {
  performancesRepository,
  type PerformanceDbFilters,
  type PerformancesRepository,
} from './performances.repository';
import type { PerformanceQueryInput } from './performances.schemas';

const ECUADOR_OFFSET_HOURS = 5;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Convierte una fecha calendario YYYY-MM-DD de Ecuador (UTC-5, sin DST)
 * al rango UTC equivalente: [YYYY-MM-DDT05:00:00.000Z, siguiente día 05:00:00.000Z).
 */
export function ecuadorDateToUtcRange(dateStr: string): { startsAtGte: Date; startsAtLt: Date } {
  const [year, month, day] = dateStr.split('-').map(Number);
  const startsAtGte = new Date(Date.UTC(year, month - 1, day, ECUADOR_OFFSET_HOURS, 0, 0, 0));
  const startsAtLt = new Date(startsAtGte.getTime() + ONE_DAY_MS);
  return { startsAtGte, startsAtLt };
}

/** Formatea una fecha UTC a YYYY-MM-DD en hora de Ecuador (America/Guayaquil, UTC-5). */
export function toEcuadorDateString(date: Date): string {
  const ecuadorTime = new Date(date.getTime() - ECUADOR_OFFSET_HOURS * 60 * 60 * 1000);
  return ecuadorTime.toISOString().slice(0, 10);
}

export interface PerformanceDto {
  id: number;
  startsAt: string;
  status: string;
  capacity: number;
  availableSeats: number;
  availability: AvailabilityStatus;
  event: {
    id: number;
    title: string;
    discipline: string;
    durationMinutes: number;
    imageUrl: string | null;
  };
  venue: {
    id: number;
    name: string;
  };
}

export function createPerformancesService(
  repository: PerformancesRepository = performancesRepository,
  nowProvider: () => Date = () => new Date(),
) {
  return {
    async listPerformances(query: PerformanceQueryInput = {}) {
      const dbFilters: PerformanceDbFilters = {};

      if (query.date) {
        const range = ecuadorDateToUtcRange(query.date);
        dbFilters.startsAtGte = range.startsAtGte;
        dbFilters.startsAtLt = range.startsAtLt;
      } else if (!query.includePast) {
        dbFilters.startsAtGte = nowProvider();
      }

      if (query.discipline) {
        dbFilters.discipline = query.discipline;
      }

      if (query.venueId !== undefined) {
        dbFilters.venueId = query.venueId;
      }

      const performances = await repository.findMany(dbFilters);
      const reservedMap = await repository.getReservedSeatsByPerformance(
        performances.map((p) => p.id),
      );

      return performances.map((perf): PerformanceDto => {
        const reserved = reservedMap.get(perf.id) ?? 0;
        const { availableSeats, availability } = computeAvailability(perf.capacity, reserved);

        return {
          id: perf.id,
          startsAt: perf.startsAt.toISOString(),
          status: perf.status,
          capacity: perf.capacity,
          availableSeats,
          availability,
          event: perf.event,
          venue: perf.venue,
        };
      });
    },

    async getFilterOptions() {
      const { performances, venues } = await repository.findFilterOptions(nowProvider());
      const dates = [...new Set(performances.map((p) => toEcuadorDateString(p.startsAt)))].sort();
      const disciplineSet = new Set(performances.map((p) => p.event.discipline));
      const disciplines = enumValues(Discipline).filter((d) => disciplineSet.has(d));

      return {
        dates,
        disciplines: disciplines.length > 0 ? disciplines : enumValues(Discipline),
        venues,
      };
    },
  };
}

export const performancesService = createPerformancesService();
