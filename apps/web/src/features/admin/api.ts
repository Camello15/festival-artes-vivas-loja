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
