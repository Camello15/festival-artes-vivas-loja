import { AppError } from '../../errors/AppError';
import { computeAvailability } from '../performances/availability';
import {
  performancesRepository,
  type PerformancesRepository,
} from '../performances/performances.repository';
import { eventsRepository, type EventsRepository } from './events.repository';

export function createEventsService(
  repository: EventsRepository = eventsRepository,
  perfRepository: Pick<PerformancesRepository, 'getReservedSeatsByPerformance'> = performancesRepository,
) {
  return {
    async getEventById(id: number) {
      const event = await repository.findById(id);
      if (!event) {
        throw AppError.notFound('Obra no encontrada');
      }

      const reservedMap = await perfRepository.getReservedSeatsByPerformance(
        event.performances.map((p) => p.id),
      );

      return {
        id: event.id,
        title: event.title,
        discipline: event.discipline,
        synopsis: event.synopsis,
        durationMinutes: event.durationMinutes,
        ageRating: event.ageRating,
        imageUrl: event.imageUrl,
        artists: event.artists,
        performances: event.performances.map((perf) => {
          const reserved = reservedMap.get(perf.id) ?? 0;
          const { availableSeats, availability } = computeAvailability(perf.capacity, reserved);

          return {
            id: perf.id,
            startsAt: perf.startsAt.toISOString(),
            status: perf.status,
            capacity: perf.capacity,
            availableSeats,
            availability,
            venue: perf.venue,
          };
        }),
      };
    },
  };
}

export const eventsService = createEventsService();
