import {
  performancesRepository,
  type PerformancesRepository,
} from '../performances/performances.repository';
import {
  artistAgendaRepository,
  type ArtistAgendaRepository,
} from './artist-agenda.repository';

export function createArtistAgendaService(
  repository: ArtistAgendaRepository = artistAgendaRepository,
  performanceRepository: Pick<PerformancesRepository, 'getReservedSeatsByPerformance'> = performancesRepository,
) {
  return {
    async listForUser(userId: number) {
      const performances = await repository.findPerformancesForUser(userId);
      const reservedSeats = await performanceRepository.getReservedSeatsByPerformance(
        performances.map((performance) => performance.id),
      );

      return performances.map((performance) => ({
        ...performance,
        startsAt: performance.startsAt.toISOString(),
        reservedSeats: reservedSeats.get(performance.id) ?? 0,
      }));
    },
  };
}

export const artistAgendaService = createArtistAgendaService();
