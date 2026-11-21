import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderRoute } from './renderRoute';

const EVENT_DETAIL = {
  id: 3,
  title: 'Raíces del Sur',
  synopsis: 'Una exploración contemporánea de los ritmos andinos del sur del Ecuador.',
  discipline: 'DANCE',
  durationMinutes: 70,
  ageRating: 'Todo público',
  imageUrl: 'https://example.com/raices.jpg',
  artists: [
    {
      id: 5,
      name: 'Colectivo Loja Danza',
      kind: 'COMPANY',
      country: 'Ecuador',
      imageUrl: null,
    },
  ],
  performances: [
    {
      id: 10,
      startsAt: '2026-11-22T00:30:00.000Z',
      status: 'SCHEDULED',
      capacity: 450,
      availableSeats: 400,
      availability: 'AVAILABLE',
      venue: { id: 1, name: 'Teatro Nacional Benjamín Carrión' },
    },
    {
      id: 11,
      startsAt: '2026-11-23T00:30:00.000Z',
      status: 'SCHEDULED',
      capacity: 450,
      availableSeats: 0,
      availability: 'SOLD_OUT',
      venue: { id: 2, name: 'Teatro Bolívar' },
    },
  ],
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

describe('EventDetailPage (/obras/:id)', () => {
  it('muestra la información completa de la obra, artistas y enlaces para reservar', { timeout: 15000 }, async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse(EVENT_DETAIL)));

    renderRoute('/obras/3');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Raíces del Sur' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Una exploración contemporánea/)).toBeInTheDocument();
    expect(screen.getByText('70 minutos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Colectivo Loja Danza/ })).toHaveAttribute(
      'href',
      '/artistas/5',
    );
    expect(screen.getByRole('link', { name: 'Teatro Nacional Benjamín Carrión' })).toHaveAttribute(
      'href',
      '/escenarios/1',
    );

    const reserveLinks = screen.getAllByRole('link', { name: 'Reservar' });
    expect(reserveLinks).toHaveLength(1);
    expect(reserveLinks[0]).toHaveAttribute('href', '/reservar/10');
  });

  it('muestra "Obra no encontrada" y enlace a la cartelera ante un 404', { timeout: 15000 }, async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        jsonResponse({ error: { code: 'NOT_FOUND', message: 'Obra no encontrada', details: [] } }, 404),
      ),
    );

    renderRoute('/obras/9999');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Obra no encontrada' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver a la cartelera' })).toHaveAttribute(
      'href',
      '/cartelera',
    );
  });
});
