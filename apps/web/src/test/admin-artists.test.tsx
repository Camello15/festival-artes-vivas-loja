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
  let artists = [{
    id: 4,
    name: 'Colectivo Loja',
    kind: 'COMPANY',
    country: 'Ecuador',
    bio: 'Compañía local',
    imageUrl: null,
    website: null,
    userId: null,
  }];

  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    if (path === '/api/auth/me') return jsonResponse({ user: admin });
    if (path === '/api/admin/artists' && (!init?.method || init.method === 'GET')) return jsonResponse(artists);
    if (path === '/api/admin/artists' && init?.method === 'POST') {
      const artist = { id: 8, userId: null, ...JSON.parse(String(init.body)) };
      artists = [...artists, artist];
      return jsonResponse(artist, 201);
    }
    const match = path.match(/^\/api\/admin\/artists\/(\d+)$/);
    if (match && init?.method === 'PUT') {
      const id = Number(match[1]);
      const updated = { id, userId: null, ...JSON.parse(String(init.body)) };
      artists = artists.map((artist) => artist.id === id ? updated : artist);
      return jsonResponse(updated);
    }
    if (match && init?.method === 'DELETE') {
      artists = artists.filter((artist) => artist.id !== Number(match[1]));
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

describe('AdminArtistsPage', () => {
  it('lista artistas y permite crear, editar y eliminar con confirmación', async () => {
    const actor = userEvent.setup();
    const fetchMock = setupAdminApi();
    renderRoute('/admin/artists');

    expect(await screen.findByRole('cell', { name: 'Colectivo Loja' })).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'Agregar artista' }));
    await actor.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Artista nuevo');
    await actor.selectOptions(screen.getByRole('combobox', { name: 'Tipo' }), 'SOLO');
    await actor.type(screen.getByRole('textbox', { name: 'País' }), 'Ecuador');
    await actor.type(screen.getByRole('textbox', { name: 'Biografía' }), 'Una biografía');
    await actor.click(screen.getByRole('button', { name: 'Crear artista' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Artista creado correctamente.');
    const createdRow = screen.getByRole('row', { name: /Artista nuevo/ });
    expect(within(createdRow).getByText('Solista')).toBeInTheDocument();

    await actor.click(within(createdRow).getByRole('button', { name: 'Editar' }));
    const nameField = screen.getByRole('textbox', { name: 'Nombre' });
    await actor.clear(nameField);
    await actor.type(nameField, 'Artista actualizado');
    await actor.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByRole('cell', { name: 'Artista actualizado' })).toBeInTheDocument();

    const updatedRow = screen.getByRole('row', { name: /Artista actualizado/ });
    await actor.click(within(updatedRow).getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByRole('dialog', { name: '¿Eliminar artista?' })).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'Sí, eliminar artista' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Artista eliminado correctamente.');
    expect(screen.queryByRole('cell', { name: 'Artista actualizado' })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/artists/8', expect.objectContaining({ method: 'DELETE' }));
  });
});
