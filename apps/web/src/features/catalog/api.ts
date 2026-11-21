import { api } from '../../lib/api';
import type {
  ArtistDetail,
  ArtistListItem,
  EventDetail,
  PerformanceFiltersResponse,
  PerformanceItem,
  PerformanceQuery,
  VenueDetail,
  VenueListItem,
} from './types';

export function getPerformances(query: PerformanceQuery = {}) {
  const params = new URLSearchParams();
  if (query.date) params.set('date', query.date);
  if (query.discipline) params.set('discipline', query.discipline);
  if (query.venueId !== undefined && query.venueId !== '') {
    params.set('venueId', String(query.venueId));
  }
  if (query.includePast) params.set('includePast', 'true');

  const qs = params.toString();
  return api.get<PerformanceItem[]>(`/performances${qs ? `?${qs}` : ''}`);
}

export function getPerformanceFilters() {
  return api.get<PerformanceFiltersResponse>('/performances/filters');
}

export function getEventById(id: number | string) {
  return api.get<EventDetail>(`/events/${id}`);
}

export function getArtists(search?: string) {
  const trimmed = search?.trim();
  const qs = trimmed ? `?search=${encodeURIComponent(trimmed)}` : '';
  return api.get<ArtistListItem[]>(`/artists${qs}`);
}

export function getArtistById(id: number | string) {
  return api.get<ArtistDetail>(`/artists/${id}`);
}

export function getVenues() {
  return api.get<VenueListItem[]>('/venues');
}

export function getVenueById(id: number | string) {
  return api.get<VenueDetail>(`/venues/${id}`);
}
