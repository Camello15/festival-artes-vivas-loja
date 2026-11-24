import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderRoute } from './renderRoute';

const SUMMARY = {
  name: 'Festival Internacional de Artes Vivas de Loja',
  edition: 2026,
  city: 'Loja, Ecuador',
  startsAt: '2026-11-20T21:00:00.000Z',
  endsAt: '2026-11-29T00:00:00.000Z',
  events: 9,
  performances: 18,
  artists: 8,
  venues: 6,
};

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HomePage', () => {
  it('muestra el resumen y las fechas del festival en hora de Ecuador', async () => {
    const fetchMock = vi.fn(() => jsonResponse(SUMMARY));
    vi.stubGlobal('fetch', fetchMock);

    renderRoute('/');

    expect(await screen.findByText(/9 obras, 18 funciones y 8 artistas y compañías en 6 escenarios/)).toBeInTheDocument();
    // 2026-11-29T00:00Z es el 28 de noviembre a las 19:00 en Ecuador.
    expect(screen.getByText('Del 20 al 28 de noviembre')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/festival/summary', expect.anything());
  });

  it('enlaza cada disciplina con la cartelera filtrada', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse(SUMMARY)));

    renderRoute('/');

    expect(screen.getByRole('link', { name: 'Danza' })).toHaveAttribute('href', '/cartelera?disciplina=DANCE');
    expect(screen.getByRole('link', { name: 'Artes de calle' })).toHaveAttribute(
      'href',
      '/cartelera?disciplina=STREET_ARTS',
    );
  });

  it('muestra un error comprensible y permite reintentar si la API no responde', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockImplementation(() => jsonResponse(SUMMARY));
    vi.stubGlobal('fetch', fetchMock);

    renderRoute('/');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No pudimos conectar con el servidor');

    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));

    expect(await screen.findByText(/9 obras/)).toBeInTheDocument();
  });
});
