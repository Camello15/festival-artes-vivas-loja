import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderRoute } from './renderRoute';

const VENUES_LIST = [
  {
    id: 1,
    name: 'Teatro Nacional Benjamín Carrión',
    address: 'Av. Salvador Bustamante Celi, Loja',
    capacity: 900,
    latitude: -3.9825,
    longitude: -79.2012,
    imageUrl: null,
  },
];

const VENUE_DETAIL = {
  ...VENUES_LIST[0],
  description: 'Principal sala escénica de la ciudad de Loja.',
  upcomingPerformances: [
    {
      id: 10,
      startsAt: '2026-11-22T00:30:00.000Z',
      status: 'SCHEDULED',
      capacity: 900,
      availableSeats: 750,
      availability: 'AVAILABLE',
      event: {
        id: 3,
        title: 'Raíces del Sur',
        discipline: 'DANCE',
        durationMinutes: 70,
        imageUrl: null,
      },
      venue: { id: 1, name: 'Teatro Nacional Benjamín Carrión' },
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

describe('Escenarios (/escenarios y /escenarios/:id)', () => {
  it('lista los escenarios con dirección y capacidad', { timeout: 15000 }, async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse(VENUES_LIST)));

    renderRoute('/escenarios');

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Teatro Nacional Benjamín Carrión' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Av. Salvador Bustamante Celi, Loja')).toBeInTheDocument();
    expect(screen.getByText('Capacidad: 900 personas')).toBeInTheDocument();
  });

  it('muestra el mapa accesible, enlace Cómo llegar y próximas funciones en /escenarios/:id', { timeout: 15000 }, async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse(VENUE_DETAIL)));

    renderRoute('/escenarios/1');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Teatro Nacional Benjamín Carrión' }),
    ).toBeInTheDocument();
    expect(
      screen.getByTitle('Mapa de ubicación de Teatro Nacional Benjamín Carrión'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cómo llegar/ })).toHaveAttribute(
      'href',
      'https://www.openstreetmap.org/directions?to=-3.9825,-79.2012',
    );
    expect(screen.getByText('Raíces del Sur')).toBeInTheDocument();
  });
});
