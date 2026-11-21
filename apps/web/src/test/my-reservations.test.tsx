import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setAuthToken, setUnauthorizedHandler } from '../lib/api';
import { renderRoute } from './renderRoute';

const user = { id: 4, name: 'Elena Loja', email: 'elena@festival.ec', role: 'PUBLIC' };
const reservation = {
  id: 73,
  code: 'FAV-GH2345',
  quantity: 2,
  status: 'CONFIRMED',
  createdAt: '2026-11-20T20:00:00.000Z',
  performance: {
    id: 18,
    startsAt: new Date(Date.now() + 86_400_000).toISOString(),
    status: 'SCHEDULED',
    capacity: 400,
    event: { id: 9, title: 'Cuerpos en tránsito', discipline: 'DANCE', durationMinutes: 65, imageUrl: null },
    venue: { id: 3, name: 'Teatro Nacional', address: 'Centro de Loja' },
  },
};

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
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

describe('MyReservationsPage', () => {
  it('muestra reservas propias y confirma su cancelación con diálogo accesible', async () => {
    const actor = userEvent.setup();
    localStorage.setItem('festival-auth', JSON.stringify({ token: 'jwt-elena', user }));
    let currentReservation = reservation;
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input);
      if (path === '/api/auth/me') return jsonResponse({ user });
      if (path === '/api/reservations/me') return jsonResponse([currentReservation]);
      if (path === `/api/reservations/${reservation.id}/cancel` && init?.method === 'PATCH') {
        currentReservation = { ...currentReservation, status: 'CANCELLED' };
        return jsonResponse(currentReservation);
      }
      return jsonResponse({ error: { code: 'NOT_FOUND', message: 'No encontrado', details: [] } }, 404);
    });
    vi.stubGlobal('fetch', fetchMock);
    renderRoute('/mis-reservas');

    expect(await screen.findByText('Cuerpos en tránsito')).toBeInTheDocument();
    expect(screen.getByText('FAV-GH2345')).toBeInTheDocument();
    expect(screen.getByText('Teatro Nacional')).toBeInTheDocument();
    expect(screen.getByText('Centro de Loja')).toBeInTheDocument();

    await actor.click(screen.getByRole('button', { name: 'Cancelar reserva FAV-GH2345' }));
    expect(screen.getByRole('dialog', { name: '¿Cancelar esta reserva?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver' })).toHaveFocus();
    await actor.click(screen.getByRole('button', { name: 'Sí, cancelar reserva' }));

    expect(await screen.findByText('Cancelada')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mis reservas' })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Cancelar reserva FAV-GH2345' })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/reservations/${reservation.id}/cancel`,
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  it('muestra una lista vacía sin ofrecer acciones de cancelación', async () => {
    localStorage.setItem('festival-auth', JSON.stringify({ token: 'jwt-elena', user }));
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      return String(input) === '/api/auth/me' ? jsonResponse({ user }) : jsonResponse([]);
    }));
    renderRoute('/mis-reservas');

    expect(await screen.findByText('Todavía no tienes reservas.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cancelar reserva/ })).not.toBeInTheDocument();
  });
});
