import { api } from '../../lib/api';

export interface AdminVenue {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  description: string;
  imageUrl: string | null;
}

export type AdminVenueInput = Omit<AdminVenue, 'id'>;

export function getAdminVenues() {
  return api.get<AdminVenue[]>('/admin/venues');
}

export function getAdminVenue(id: number) {
  return api.get<AdminVenue>(`/admin/venues/${id}`);
}

export function createAdminVenue(data: AdminVenueInput) {
  return api.post<AdminVenue>('/admin/venues', data);
}

export function updateAdminVenue(id: number, data: AdminVenueInput) {
  return api.put<AdminVenue>(`/admin/venues/${id}`, data);
}

export function deleteAdminVenue(id: number) {
  return api.delete<void>(`/admin/venues/${id}`);
}

export interface AdminArtist {
  id: number;
  name: string;
  kind: 'SOLO' | 'COMPANY';
  country: string;
  bio: string;
  imageUrl: string | null;
  website: string | null;
  userId: number | null;
}

export type AdminArtistInput = Omit<AdminArtist, 'id' | 'userId'>;

export function getAdminArtists() {
  return api.get<AdminArtist[]>('/admin/artists');
}

export function getAdminArtist(id: number) {
  return api.get<AdminArtist>(`/admin/artists/${id}`);
}

export function createAdminArtist(data: AdminArtistInput) {
  return api.post<AdminArtist>('/admin/artists', data);
}

export function updateAdminArtist(id: number, data: AdminArtistInput) {
  return api.put<AdminArtist>(`/admin/artists/${id}`, data);
}

export function deleteAdminArtist(id: number) {
  return api.delete<void>(`/admin/artists/${id}`);
}

export interface AdminEventArtist {
  id: number;
  name: string;
  kind: 'SOLO' | 'COMPANY';
  country: string;
}

export interface AdminEvent {
  id: number;
  title: string;
  discipline: string;
  synopsis: string;
  durationMinutes: number;
  ageRating: string;
  imageUrl: string | null;
  artists: AdminEventArtist[];
}

export interface AdminEventInput {
  title: string;
  discipline: string;
  synopsis: string;
  durationMinutes: number;
  ageRating: string;
  imageUrl: string | null;
  artistIds: number[];
}

export function getAdminEvents() {
  return api.get<AdminEvent[]>('/admin/events');
}

export function getAdminEvent(id: number) {
  return api.get<AdminEvent>(`/admin/events/${id}`);
}

export function createAdminEvent(data: AdminEventInput) {
  return api.post<AdminEvent>('/admin/events', data);
}

export function updateAdminEvent(id: number, data: AdminEventInput) {
  return api.put<AdminEvent>(`/admin/events/${id}`, data);
}

export function deleteAdminEvent(id: number) {
  return api.delete<void>(`/admin/events/${id}`);
}

export interface AdminPerformance {
  id: number;
  eventId: number;
  venueId: number;
  startsAt: string;
  capacity: number;
  status: 'SCHEDULED' | 'CANCELLED';
  reservedSeats: number;
  event: Pick<AdminEvent, 'id' | 'title' | 'discipline'>;
  venue: Pick<AdminVenue, 'id' | 'name' | 'capacity'>;
  _count: { reservations: number };
}

export interface AdminPerformanceInput {
  eventId: number;
  venueId: number;
  startsAt: string;
  capacity: number;
  status: 'SCHEDULED' | 'CANCELLED';
}

export interface AdminPerformanceReservation {
  id: number;
  code: string;
  quantity: number;
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  user: { id: number; name: string };
}

export interface AdminPerformanceReservations {
  performance: AdminPerformance;
  totalConfirmed: number;
  reservations: AdminPerformanceReservation[];
}

export function getAdminPerformances() {
  return api.get<AdminPerformance[]>('/admin/performances');
}

export function getAdminPerformance(id: number) {
  return api.get<AdminPerformance>(`/admin/performances/${id}`);
}

export function createAdminPerformance(data: AdminPerformanceInput) {
  return api.post<AdminPerformance>('/admin/performances', data);
}

export function updateAdminPerformance(id: number, data: AdminPerformanceInput) {
  return api.put<AdminPerformance>(`/admin/performances/${id}`, data);
}

export function cancelAdminPerformance(id: number) {
  return api.patch<{ performance: AdminPerformance; cancelledReservations: number }>(`/admin/performances/${id}/cancel`);
}

export function deleteAdminPerformance(id: number) {
  return api.delete<void>(`/admin/performances/${id}`);
}

export function getAdminPerformanceReservations(id: number) {
  return api.get<AdminPerformanceReservations>(`/admin/performances/${id}/reservations`);
}
