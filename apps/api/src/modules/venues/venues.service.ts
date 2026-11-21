import { AppError } from '../../errors/AppError';
import { computeAvailability } from '../performances/availability';
import {
  performancesRepository,
  type PerformancesRepository,
} from '../performances/performances.repository';
import { venuesRepository, type VenuesRepository } from './venues.repository';

export function createVenuesService(
  repository: VenuesRepository = venuesRepository,
  perfRepository: Pick<PerformancesRepository, 'getReservedSeatsByPerformance'> = performancesRepository,
  nowProvider: () => Date = () => new Date(),
) {
  return {
    async listVenues() {
      return repository.findMany();
    },

    async getVenueById(id: number) {
      const venue = await repository.findByIdWithUpcoming(id, nowProvider());
      if (!venue) {
        throw AppError.notFound('Escenario no encontrado');
      }

      const reservedMap = await perfRepository.getReservedSeatsByPerformance(
        venue.performances.map((p) => p.id),
      );

      const upcomingPerformances = venue.performances.map((perf) => {
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
          venue: { id: venue.id, name: venue.name },
        };
      });

      return {
        id: venue.id,
        name: venue.name,
        address: venue.address,
        capacity: venue.capacity,
        latitude: venue.latitude,
        longitude: venue.longitude,
        description: venue.description,
        imageUrl: venue.imageUrl,
        upcomingPerformances,
      };
    },
  };
}

export const venuesService = createVenuesService();
