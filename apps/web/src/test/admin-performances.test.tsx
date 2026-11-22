import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setAuthToken, setUnauthorizedHandler } from '../lib/api';
import { renderRoute } from './renderRoute';

const admin = { id: 1, name: 'Admin Festival', email: 'admin@festival.ec', role: 'ADMIN' };
const event = { id: 3, title: 'Voces de Loja', discipline: 'THEATER', synopsis: 'Una obra', durationMinutes: 70, ageRating: 'Todo público', imageUrl: null, artists: [] };
const venue = { id: 5, name: 'Teatro Bolívar', address: 'Loja', latitude: -3.99, longitude: -79.2, capacity: 200, description: '', imageUrl: null };
const performanceStart = '2030-05-12T20:30:00.000Z';

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
}

function setupAdminApi() {
  localStorage.setItem('festival-auth', JSON.stringify({ token: 'jwt-admin', user: admin }));
  let performances = [{
    id: 7,
    eventId: event.id,
    venueId: venue.id,
    startsAt: performanceStart,
    capacity: 100,
    status: 'SCHEDULED',
    reservedSeats: 2,
    event: { id: event.id, title: event.title, discipline: event.discipline },
    venue: { id: venue.id, name: venue.name, capacity: venue.capacity },
    _count: { reservations: 1 },
  }];
  let reservations = [{ id: 15, code: 'FAV-ABC234', quantity: 2, status: 'CONFIRMED', createdAt: performanceStart, user: { id: 8, name: 'Lucía Asistente' } }];

  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    if (path === '/api/auth/me') return jsonResponse({ user: admin });
    if (path === '/api/admin/performances' && (!init?.method || init.method === 'GET')) return jsonResponse(performances);
    if (path === '/api/admin/events' && (!init?.method || init.method === 'GET')) return jsonResponse([event]);
    if (path === '/api/admin/venues' && (!init?.method || init.method === 'GET')) return jsonResponse([venue]);
    if (path === '/api/admin/performances' && init?.method === 'POST') {
      const body = JSON.parse(String(init.body));
      const created = {
        id: 9,
        ...body,
        reservedSeats: 0,
        event: { id: body.eventId, title: 'Voces nuevas', discipline: event.discipline },
        venue: { id: body.venueId, name: venue.name, capacity: venue.capacity },
        _count: { reservations: 0 },
      };
      performances = [...performances, created];
      return jsonResponse(created, 201);
    }
    const reservationsMatch = path.match(/^\/api\/admin\/performances\/(\d+)\/reservations$/);
    if (reservationsMatch && (!init?.method || init.method === 'GET')) {
      const performance = performances.find((item) => item.id === Number(reservationsMatch[1]));
      return performance
        ? jsonResponse({ performance, totalConfirmed: reservations.filter((reservation) => reservation.status === 'CONFIRMED').reduce((total, reservation) => total + reservation.quantity, 0), reservations })
        : jsonResponse({ error: { code: 'NOT_FOUND', message: 'Función no encontrada', details: [] } }, 404);
    }
    const cancelMatch = path.match(/^\/api\/admin\/performances\/(\d+)\/cancel$/);
    if (cancelMatch && init?.method === 'PATCH') {
      const id = Number(cancelMatch[1]);
      const performance = performances.find((item) => item.id === id);
      if (!performance) return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Función no encontrada', details: [] } }, 404);
      const cancelledReservations = reservations.filter((reservation) => reservation.status === 'CONFIRMED').length;
      reservations = reservations.map((reservation) => ({ ...reservation, status: 'CANCELLED' }));
      const updated = { ...performance, status: 'CANCELLED', reservedSeats: 0 };
      performances = performances.map((item) => item.id === id ? updated : item);
      return jsonResponse({ performance: updated, cancelledReservations });
    }
    const match = path.match(/^\/api\/admin\/performances\/(\d+)$/);
    if (match && init?.method === 'PUT') {
      const id = Number(match[1]);
      const body = JSON.parse(String(init.body));
      const current = performances.find((item) => item.id === id);
      const updated = {
        ...current,
        ...body,
        event: { id: body.eventId, title: current?.event.title ?? event.title, discipline: event.discipline },
        venue: { id: body.venueId, name: venue.name, capacity: venue.capacity },
      };
      performances = performances.map((item) => item.id === id ? updated : item);
      return jsonResponse(updated);
    }
    if (match && init?.method === 'DELETE') {
      return jsonResponse({ error: { code: 'CONFLICT', message: 'No se puede eliminar una función que tiene reservas; cancélala para conservar su historial', details: [] } }, 409);
    }
    return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada', details: [] } }, 404);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  localStorage.clear();
  setAuthToken(null);
  setUnauthorizedHandler(null);
});

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('Administración de funciones', () => {
  it('crea y edita funciones, muestra sus reservas y permite cancelarlas conservando el historial', async () => {
    const actor = userEvent.setup();
    const fetchMock = setupAdminApi();
    renderRoute('/admin/performances');

    expect(await screen.findByText('Voces de Loja')).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'Agregar función' }));
    await actor.selectOptions(screen.getByRole('combobox', { name: 'Obra' }), '3');
    await actor.selectOptions(screen.getByRole('combobox', { name: 'Escenario' }), '5');
    fireEvent.change(screen.getByLabelText(/Fecha y hora/), { target: { value: '2030-05-13T15:30' } });
    await actor.type(screen.getByRole('spinbutton', { name: 'Aforo' }), '80');
    await actor.click(screen.getByRole('button', { name: 'Crear función' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Función creada correctamente.');
    const createdRow = screen.getByRole('row', { name: /Voces nuevas.*Teatro Bolívar/ });
    const createCall = fetchMock.mock.calls.find(([input, init]) => String(input) === '/api/admin/performances' && init?.method === 'POST');
    expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({ eventId: 3, venueId: 5, startsAt: '2030-05-13T20:30:00.000Z', capacity: 80, status: 'SCHEDULED' });

    await actor.click(within(createdRow).getByRole('button', { name: 'Editar' }));
    const capacityField = screen.getByRole('spinbutton', { name: 'Aforo' });
    await actor.clear(capacityField);
    await actor.type(capacityField, '90');
    await actor.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Función actualizada correctamente.');

    const updatedRow = screen.getByRole('row', { name: /Voces nuevas.*Teatro Bolívar/ });
    await actor.click(within(updatedRow).getByRole('link', { name: 'Reservas' }));
    expect(await screen.findByRole('heading', { name: 'Reservas: Voces nuevas' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Entradas confirmadas: 2 / 90');
    expect(screen.getByRole('cell', { name: 'FAV-ABC234' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Lucía Asistente' })).toBeInTheDocument();

    await actor.click(screen.getByRole('link', { name: '← Volver a funciones' }));
    const currentRow = screen.getByRole('row', { name: /Voces nuevas.*Teatro Bolívar/ });
    await actor.click(within(currentRow).getByRole('button', { name: 'Cancelar función' }));
    expect(screen.getByRole('dialog', { name: '¿Cancelar función?' })).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'Sí, cancelar función' }));
    expect(await screen.findByRole('status')).toHaveTextContent('1 reservas confirmadas cambiaron a canceladas.');

    const cancelCall = fetchMock.mock.calls.find(([input, init]) => String(input) === '/api/admin/performances/9/cancel' && init?.method === 'PATCH');
    expect(cancelCall).toBeDefined();
    await actor.click(within(screen.getByRole('row', { name: /Voces nuevas.*Teatro Bolívar/ })).getByRole('link', { name: 'Reservas' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Entradas confirmadas: 0 / 90');
    expect(screen.getByRole('cell', { name: 'Cancelada' })).toBeInTheDocument();
  });
});
