import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderRoute } from './renderRoute';

const ARTISTS_LIST = [
  {
    id: 1,
    name: 'Colectivo Loja Danza',
    kind: 'COMPANY',
    country: 'Ecuador',
    imageUrl: null,
  },
  {
    id: 2,
    name: 'María Fernanda Ruiz',
    kind: 'SOLO',
    country: 'Colombia',
    imageUrl: null,
  },
];

const ARTIST_DETAIL = {
  id: 1,
  name: 'Colectivo Loja Danza',
  kind: 'COMPANY',
  country: 'Ecuador',
  bio: 'Compañía lojana dedicada a la danza contemporánea.',
  imageUrl: null,
  website: 'https://example.org/loja-danza',
  events: [{ id: 3, title: 'Raíces del Sur', discipline: 'DANCE' }],
};

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Artistas (/artistas y /artistas/:id)', () => {
  it('lista artistas y filtra por nombre al escribir en el buscador', { timeout: 15000 }, async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('search=Mar')) return jsonResponse([ARTISTS_LIST[1]]);
      return jsonResponse(ARTISTS_LIST);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderRoute('/artistas');

    expect(await screen.findByText('Colectivo Loja Danza')).toBeInTheDocument();
    expect(screen.getByText('María Fernanda Ruiz')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Buscar por nombre'), 'Mar');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/artists?search=Mar'),
        expect.anything(),
      );
    });
    expect(screen.queryByText('Colectivo Loja Danza')).not.toBeInTheDocument();
  });

  it('muestra la biografía, enlace web y obras en /artistas/:id', { timeout: 15000 }, async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse(ARTIST_DETAIL)));

    renderRoute('/artistas/1');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Colectivo Loja Danza' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Compañía lojana dedicada/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sitio web oficial/ })).toHaveAttribute(
      'href',
      'https://example.org/loja-danza',
    );
    expect(screen.getByRole('link', { name: /Raíces del Sur/ })).toHaveAttribute('href', '/obras/3');
  });
});
