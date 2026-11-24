import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setAuthToken, setUnauthorizedHandler } from '../lib/api';
import { renderRoute } from './renderRoute';

const attendee = { id: 8, name: 'Sofía Loja', email: 'sofia@festival.ec', role: 'PUBLIC' };
const performance = {
  id: 21,
  startsAt: '2030-01-01T20:00:00.000Z',
  status: 'SCHEDULED',
  capacity: 50,
  availableSeats: 7,
  event: { id: 5, title: 'Voces del Sur', discipline: 'MUSIC', durationMinutes: 70, imageUrl: null },
  venue: { id: 2, name: 'Teatro Bolívar' },
};

function response(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
}

function stubReservationApi(createResponse: (body: { performanceId: number; quantity: number }) => Promise<Response>) {
  localStorage.setItem('festival-auth', JSON.stringify({ token: 'jwt-asistente', user: attendee }));
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    if (path === '/api/auth/me') return response({ user: attendee });
    if (path === '/api/performances') return response([performance]);
    if (path === '/api/reservations' && init?.method === 'POST') {
      return createResponse(JSON.parse(String(init.body)) as { performanceId: number; quantity: number });
    }
    return response({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada', details: [] } }, 404);
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

describe('ReservePage', () => {
  it('muestra la función, permite elegir cantidad y confirma con el código', async () => {
    const user = userEvent.setup();
    const fetchMock = stubReservationApi((body) =>
      response({
        id: 90,
        code: 'FAV-ABC234',
        quantity: body.quantity,
        status: 'CONFIRMED',
        performance,
      }, 201),
    );
    renderRoute('/reservar/21');

    expect(await screen.findByRole('heading', { name: 'Voces del Sur' })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Reservar entradas' })).toHaveAttribute('aria-busy', 'false');
    expect(screen.getByText('Teatro Bolívar')).toBeInTheDocument();
    expect(screen.getByText('7 de 50 entradas')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Cantidad de entradas'), '2');
    await user.click(screen.getByRole('button', { name: 'Confirmar reserva' }));

    expect(await screen.findByRole('heading', { name: 'Reserva confirmada' })).toBeInTheDocument();
    expect(screen.getByText('FAV-ABC234')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/reservations',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ performanceId: 21, quantity: 2 }) }),
    );
  });

  it('muestra errores de aforo devueltos por la API', async () => {
    const user = userEvent.setup();
    stubReservationApi(() => response({ error: { code: 'CONFLICT', message: 'Solo quedan 0 entradas', details: [] } }, 409));
    renderRoute('/reservar/21');

    await screen.findByRole('heading', { name: 'Voces del Sur' });
    await user.click(screen.getByRole('button', { name: 'Confirmar reserva' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Solo quedan 0 entradas');
  });
});
