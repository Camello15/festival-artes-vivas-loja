import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setAuthToken, setUnauthorizedHandler } from '../lib/api';
import { renderRoute } from './renderRoute';

const admin = { id: 1, name: 'Admin Festival', email: 'admin@festival.ec', role: 'ADMIN' };

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
}

function setupAdminApi() {
  localStorage.setItem('festival-auth', JSON.stringify({ token: 'jwt-admin', user: admin }));
  let venues = [{
    id: 4,
    name: 'Teatro Bolívar',
    address: 'Centro de Loja',
    latitude: -3.99,
    longitude: -79.2,
    capacity: 500,
    description: 'Teatro histórico',
    imageUrl: null,
  }];

  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    if (path === '/api/auth/me') return jsonResponse({ user: admin });
    if (path === '/api/admin/venues' && (!init?.method || init.method === 'GET')) return jsonResponse(venues);
    if (path === '/api/admin/venues' && init?.method === 'POST') {
      const body = JSON.parse(String(init.body));
      const venue = { id: 8, ...body };
      venues = [...venues, venue];
      return jsonResponse(venue, 201);
    }
    const match = path.match(/^\/api\/admin\/venues\/(\d+)$/);
    if (match && init?.method === 'PUT') {
      const id = Number(match[1]);
      const updated = { id, ...JSON.parse(String(init.body)) };
      venues = venues.map((venue) => venue.id === id ? updated : venue);
      return jsonResponse(updated);
    }
    if (match && init?.method === 'DELETE') {
      venues = venues.filter((venue) => venue.id !== Number(match[1]));
      return Promise.resolve(new Response(null, { status: 204 }));
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

describe('AdminVenuesPage', () => {
  it('lista escenarios y permite crear, editar y eliminar con confirmación', async () => {
    const actor = userEvent.setup();
    const fetchMock = setupAdminApi();
    renderRoute('/admin/venues');

    expect(await screen.findByRole('cell', { name: 'Teatro Bolívar' })).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'Agregar escenario' }));
    await actor.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Plaza de prueba');
    await actor.type(screen.getByRole('textbox', { name: 'Dirección' }), 'Centro de Loja');
    await actor.type(screen.getByRole('spinbutton', { name: 'Latitud' }), '-3.99');
    await actor.type(screen.getByRole('spinbutton', { name: 'Longitud' }), '-79.2');
    await actor.type(screen.getByRole('spinbutton', { name: 'Aforo' }), '350');
    await actor.type(screen.getByRole('textbox', { name: 'Descripción' }), 'Escenario al aire libre');
    await actor.click(screen.getByRole('button', { name: 'Crear escenario' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Escenario creado correctamente.');
    const createdRow = screen.getByRole('row', { name: /Plaza de prueba/ });
    expect(within(createdRow).getByText('350')).toBeInTheDocument();

    await actor.click(within(createdRow).getByRole('button', { name: 'Editar' }));
    const nameField = screen.getByRole('textbox', { name: 'Nombre' });
    await actor.clear(nameField);
    await actor.type(nameField, 'Plaza actualizada');
    await actor.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByRole('cell', { name: 'Plaza actualizada' })).toBeInTheDocument();

    const updatedRow = screen.getByRole('row', { name: /Plaza actualizada/ });
    await actor.click(within(updatedRow).getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByRole('dialog', { name: '¿Eliminar escenario?' })).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'Sí, eliminar escenario' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Escenario eliminado correctamente.');
    expect(screen.queryByRole('cell', { name: 'Plaza actualizada' })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/venues/8', expect.objectContaining({ method: 'DELETE' }));
  });
});
