import { FESTIVAL_INFO } from '../../domain/festival';
import { festivalRepository, type FestivalRepository } from './festival.repository';

export interface FestivalSummary {
  name: string;
  edition: number;
  city: string;
  startsAt: string | null;
  endsAt: string | null;
  events: number;
  performances: number;
  artists: number;
  venues: number;
}

// Se recibe el repository como parámetro para poder probar el service
// con un repository simulado (sin base de datos).
export function createFestivalService(repository: FestivalRepository = festivalRepository) {
  return {
    async getSummary(): Promise<FestivalSummary> {
      const [counts, range] = await Promise.all([
        repository.getCounts(),
        repository.getPerformanceDateRange(),
      ]);

      return {
        name: FESTIVAL_INFO.name,
        edition: FESTIVAL_INFO.edition,
        city: FESTIVAL_INFO.city,
        // Las fechas del festival se derivan de las funciones programadas.
        startsAt: range.first?.toISOString() ?? null,
        endsAt: range.last?.toISOString() ?? null,
        ...counts,
      };
    },
  };
}

export const festivalService = createFestivalService();
