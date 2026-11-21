import { api } from '../../lib/api';

export interface ArtistPerformance {
  id: number;
  startsAt: string;
  status: 'SCHEDULED' | 'CANCELLED';
  capacity: number;
  reservedSeats: number;
  event: {
    id: number;
    title: string;
    discipline: string;
    durationMinutes: number;
    imageUrl: string | null;
  };
  venue: { id: number; name: string };
}

export function getArtistPerformances() {
  return api.get<ArtistPerformance[]>('/me/artist/performances');
}
