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
