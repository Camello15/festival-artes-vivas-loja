import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderRoute } from './renderRoute';

const FILTERS_RESPONSE = {
  dates: ['2026-11-21', '2026-11-22'],
  disciplines: ['DANCE', 'THEATER'],
  venues: [
    { id: 1, name: 'Teatro Nacional Benjamín Carrión' },
    { id: 2, name: 'Teatro Bolívar' },
  ],
};

const PERFORMANCES_RESPONSE = [
  {
    id: 10,
    startsAt: '2026-11-22T00:30:00.000Z',
    status: 'SCHEDULED',
    capacity: 450,
    availableSeats: 400,
    availability: 'AVAILABLE',
    event: {
      id: 3,
      title: 'Raíces del Sur',
      discipline: 'DANCE',
      durationMinutes: 70,
      imageUrl: null,
    },
    venue: { id: 2, name: 'Teatro Bolívar' },
  },
  {
    id: 11,
    startsAt: '2026-11-23T01:00:00.000Z',
    status: 'SCHEDULED',
    capacity: 200,
    availableSeats: 15,
    availability: 'FEW_LEFT',
    event: {
      id: 4,
      title: 'Voces de Loja',
      discipline: 'THEATER',
      durationMinutes: 85,
      imageUrl: null,
    },
    venue: { id: 1, name: 'Teatro Nacional Benjamín Carrión' },
  },
];

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

describe('ProgramPage (/cartelera)', () => {
  it('renderiza las funciones agrupadas por día con su disponibilidad', { timeout: 15000 }, async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/api/performances/filters')) return jsonResponse(FILTERS_RESPONSE);
        return jsonResponse(PERFORMANCES_RESPONSE);
      }),
    );

    renderRoute('/cartelera');

    expect(await screen.findByText('Raíces del Sur')).toBeInTheDocument();
    expect(screen.getByText('Voces de Loja')).toBeInTheDocument();
    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByText('Últimas entradas')).toBeInTheDocument();
    expect(screen.getByText('2 funciones encontradas')).toBeInTheDocument();
  });

  it('al cambiar un filtro vuelve a consultar la API con los parámetros', { timeout: 15000 }, async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/api/performances/filters')) return jsonResponse(FILTERS_RESPONSE);
      if (url.includes('discipline=DANCE')) return jsonResponse([PERFORMANCES_RESPONSE[0]]);
      return jsonResponse(PERFORMANCES_RESPONSE);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderRoute('/cartelera');

    await screen.findByText('Raíces del Sur');

    await user.selectOptions(screen.getByLabelText('Disciplina'), 'DANCE');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/performances?discipline=DANCE'),
        expect.anything(),
      );
    });
    expect(screen.queryByText('Voces de Loja')).not.toBeInTheDocument();
  });

  it('muestra estado vacío y permite limpiar filtros cuando no hay resultados', { timeout: 15000 }, async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/api/performances/filters')) return jsonResponse(FILTERS_RESPONSE);
      if (url.includes('discipline=DANCE')) return jsonResponse([]);
      return jsonResponse(PERFORMANCES_RESPONSE);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderRoute('/cartelera?disciplina=DANCE');

    expect(await screen.findByText('No hay funciones con estos filtros')).toBeInTheDocument();

    const clearButtons = screen.getAllByRole('button', { name: 'Limpiar filtros' });
    await user.click(clearButtons[clearButtons.length - 1]);

    expect(await screen.findByText('Raíces del Sur')).toBeInTheDocument();
  });
});
