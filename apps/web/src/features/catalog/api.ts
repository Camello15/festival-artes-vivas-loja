import { api } from '../../lib/api';
import type {
  PerformanceFiltersResponse,
  PerformanceItem,
  PerformanceQuery,
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
