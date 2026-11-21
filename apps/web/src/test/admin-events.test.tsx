import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setAuthToken, setUnauthorizedHandler } from '../lib/api';
import { renderRoute } from './renderRoute';

const admin = { id: 1, name: 'Admin Festival', email: 'admin@festival.ec', role: 'ADMIN' };
const artists = [
  { id: 11, name: 'Compañía Loja', kind: 'COMPANY', country: 'Ecuador', bio: '', imageUrl: null, website: null, userId: null },
  { id: 12, name: 'Dúo Andino', kind: 'SOLO', country: 'Ecuador', bio: '', imageUrl: null, website: null, userId: null },
];

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
}

function setupAdminApi() {
  localStorage.setItem('festival-auth', JSON.stringify({ token: 'jwt-admin', user: admin }));
  let events = [{
    id: 3,
    title: 'Voces de Loja',
    discipline: 'THEATER',
    synopsis: 'Una obra de prueba.',
    durationMinutes: 70,
    ageRating: 'Todo público',
    imageUrl: null,
    artists: [{ id: 11, name: 'Compañía Loja', kind: 'COMPANY', country: 'Ecuador' }],
  }];

  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    if (path === '/api/auth/me') return jsonResponse({ user: admin });
    if (path === '/api/admin/events' && (!init?.method || init.method === 'GET')) return jsonResponse(events);
    if (path === '/api/admin/artists' && (!init?.method || init.method === 'GET')) return jsonResponse(artists);
    if (path === '/api/admin/events' && init?.method === 'POST') {
      const inputBody = JSON.parse(String(init.body));
      const event = {
        id: 8,
        ...inputBody,
        artists: inputBody.artistIds.map((id: number) => artists.find((artist) => artist.id === id)),
      };
      events = [...events, event];
      return jsonResponse(event, 201);
    }
    const match = path.match(/^\/api\/admin\/events\/(\d+)$/);
    if (match && init?.method === 'PUT') {
      const id = Number(match[1]);
      const inputBody = JSON.parse(String(init.body));
      const updated = {
        id,
        ...inputBody,
        artists: inputBody.artistIds.map((artistId: number) => artists.find((artist) => artist.id === artistId)),
      };
      events = events.map((event) => event.id === id ? updated : event);
      return jsonResponse(updated);
    }
    if (match && init?.method === 'DELETE' && match[1] === '3') {
      return jsonResponse({ error: { code: 'CONFLICT', message: 'No se puede eliminar una obra que tiene funciones asociadas', details: [] } }, 409);
    }
    if (match && init?.method === 'DELETE') {
      events = events.filter((event) => event.id !== Number(match[1]));
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

describe('AdminEventsPage', () => {
  it('lista obras, asocia artistas por IDs, permite editar y presenta conflicto al borrar una obra con funciones', async () => {
    const actor = userEvent.setup();
    const fetchMock = setupAdminApi();
    renderRoute('/admin/events');

    expect(await screen.findByRole('cell', { name: 'Voces de Loja' })).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'Agregar obra' }));
    await actor.type(screen.getByRole('textbox', { name: 'Título' }), 'Nueva obra');
    await actor.selectOptions(screen.getByRole('combobox', { name: 'Disciplina' }), 'DANCE');
    await actor.type(screen.getByRole('textbox', { name: 'Sinopsis' }), 'Una sinopsis nueva.');
    await actor.type(screen.getByRole('spinbutton', { name: 'Duración (minutos)' }), '65');
    const ageRating = screen.getByRole('textbox', { name: 'Clasificación de edad' });
    await actor.clear(ageRating);
    await actor.type(ageRating, '+12');
    const artistSelect = screen.getByRole('listbox', { name: 'Artistas y compañías' });
    expect(within(artistSelect).getByRole('option', { name: 'Compañía Loja' })).toBeInTheDocument();
    await actor.selectOptions(artistSelect, ['11', '12']);
    await actor.click(screen.getByRole('button', { name: 'Crear obra' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Obra creada correctamente.');
    const createdRow = screen.getByRole('row', { name: /Nueva obra/ });
    expect(within(createdRow).getByText('Compañía Loja, Dúo Andino')).toBeInTheDocument();
    const createCall = fetchMock.mock.calls.find(([input, init]) => String(input) === '/api/admin/events' && init?.method === 'POST');
    expect(JSON.parse(String(createCall?.[1]?.body)).artistIds).toEqual([11, 12]);

    await actor.click(within(createdRow).getByRole('button', { name: 'Editar' }));
    const editedTitle = screen.getByRole('textbox', { name: 'Título' });
    await actor.clear(editedTitle);
    await actor.type(editedTitle, 'Obra editada');
    await actor.selectOptions(screen.getByRole('listbox', { name: 'Artistas y compañías' }), ['12']);
    await actor.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByRole('cell', { name: 'Obra editada' })).toBeInTheDocument();

    const originalRow = screen.getByRole('row', { name: /Voces de Loja/ });
    await actor.click(within(originalRow).getByRole('button', { name: 'Eliminar' }));
    await actor.click(screen.getByRole('button', { name: 'Sí, eliminar obra' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se puede eliminar una obra que tiene funciones asociadas');
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/events/3', expect.objectContaining({ method: 'DELETE' }));
  });
});
