import { api } from '../../lib/api';

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

export function getFestivalSummary() {
  return api.get<FestivalSummary>('/festival/summary');
}
