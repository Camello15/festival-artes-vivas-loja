import { api } from '../../lib/api';

export interface ReservablePerformance {
  id: number;
  startsAt: string;
  status: string;
  capacity: number;
  availableSeats: number;
  event: {
    id: number;
    title: string;
    discipline: string;
    durationMinutes: number;
    imageUrl: string | null;
  };
  venue: { id: number; name: string };
}

export interface ReservationConfirmation {
  id: number;
  code: string;
  quantity: number;
  status: string;
  performance: ReservablePerformance;
}

export interface MyReservation {
  id: number;
  code: string;
  quantity: number;
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  performance: {
    id: number;
    startsAt: string;
    status: string;
    capacity: number;
    event: {
      id: number;
      title: string;
      discipline: string;
      durationMinutes: number;
      imageUrl: string | null;
    };
    venue: { id: number; name: string; address: string };
  };
}

export function getReservablePerformance(id: number) {
  return api.get<ReservablePerformance[]>('/performances').then((performances) => {
    const performance = performances.find((item) => item.id === id);
    if (!performance) throw new Error('No encontramos esta función en la cartelera.');
    return performance;
  });
}

export function createReservation(performanceId: number, quantity: number) {
  return api.post<ReservationConfirmation>('/reservations', { performanceId, quantity });
}

export function getMyReservations() {
  return api.get<MyReservation[]>('/reservations/me');
}

export function cancelReservation(id: number) {
  return api.patch<MyReservation>(`/reservations/${id}/cancel`);
}
