import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setAuthToken, setUnauthorizedHandler } from '../lib/api';
import type { AuthUser } from '../features/auth/api';
import { renderRoute } from './renderRoute';

const artist = { id: 22, name: 'Lucía Paredes', email: 'lucia@festival.ec', role: 'ARTIST' as const };
const performances = [
  {
    id: 8,
    startsAt: '2026-12-04T00:30:00.000Z',
    status: 'CANCELLED' as const,
    capacity: 350,
    reservedSeats: 12,
    event: { id: 5, title: 'Obra tardía', discipline: 'DANCE', durationMinutes: 65, imageUrl: null },
    venue: { id: 3, name: 'Teatro Bolívar' },
  },
  {
    id: 7,
    startsAt: '2026-12-02T23:30:00.000Z',
    status: 'SCHEDULED' as const,
    capacity: 450,
    reservedSeats: 27,
    event: { id: 4, title: 'Obra temprana', discipline: 'THEATER', durationMinutes: 80, imageUrl: null },
    venue: { id: 1, name: 'Teatro Nacional' },
  },
];

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
}

function saveSession(user: AuthUser = artist) {
  localStorage.setItem('festival-auth', JSON.stringify({ token: 'jwt-artista', user }));
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

describe('ArtistAgendaPage', () => {
  it('muestra las funciones por fecha con datos de obra, escenario, estado y entradas', async () => {
    saveSession();
    const authorizationHeaders: string[] = [];
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === '/api/auth/me') return jsonResponse({ user: artist });
      authorizationHeaders.push(new Headers(init?.headers).get('Authorization') ?? '');
      return jsonResponse(performances);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderRoute('/mi-agenda');

    expect(await screen.findByText('Teatro Nacional')).toBeInTheDocument();
    expect(screen.getByText('27 / 450')).toBeInTheDocument();
    expect(screen.getByText(/80 min/)).toBeInTheDocument();
    expect(screen.getByText('Programada')).toBeInTheDocument();
    expect(screen.getByText('Teatro Bolívar')).toBeInTheDocument();
    expect(screen.getByText('12 / 350')).toBeInTheDocument();
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent))
      .toEqual(['Obra temprana', 'Obra tardía']);
    expect(fetchMock).toHaveBeenCalledWith('/api/me/artist/performances', expect.anything());
    expect(authorizationHeaders).toContain('Bearer jwt-artista');
  });

  it('muestra el estado de carga mientras espera la agenda', async () => {
    saveSession();
    let resolveAgenda!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      if (String(input) === '/api/auth/me') return jsonResponse({ user: artist });
      return new Promise<Response>((resolve) => { resolveAgenda = resolve; });
    }));

    renderRoute('/mi-agenda');
    expect(await screen.findByText('Cargando tu agenda…')).toBeInTheDocument();

    resolveAgenda(await jsonResponse([]));
    expect(await screen.findByText('Todavía no tienes funciones en tu agenda.')).toBeInTheDocument();
  });

  it('explica cuando no hay funciones o falta vincular el perfil de artista', async () => {
    saveSession();
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => (
      String(input) === '/api/auth/me' ? jsonResponse({ user: artist }) : jsonResponse([])
    )));

    renderRoute('/mi-agenda');

    expect(await screen.findByText('Todavía no tienes funciones en tu agenda.')).toBeInTheDocument();
    expect(screen.getByText(/verifica que tu cuenta tenga un perfil de artista vinculado/)).toBeInTheDocument();
  });

  it('muestra el error de API y permite reintentar', async () => {
    const actor = userEvent.setup();
    saveSession();
    let agendaRequests = 0;
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      if (String(input) === '/api/auth/me') return jsonResponse({ user: artist });
      agendaRequests += 1;
      return agendaRequests === 1
        ? jsonResponse({ error: { code: 'INTERNAL_ERROR', message: 'No pudimos cargar la agenda.' } }, 500)
        : jsonResponse(performances);
    }));

    renderRoute('/mi-agenda');

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar la agenda.');
    await actor.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(await screen.findByText('Obra temprana')).toBeInTheDocument();
    expect(agendaRequests).toBe(2);
  });

  it('redirige a ingresar sin sesión y bloquea otros roles', async () => {
    const anonymous = renderRoute('/mi-agenda');
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).toBeInTheDocument();
    expect(anonymous.router.state.location.pathname).toBe('/ingresar');
  });

  it.each([
    ['PUBLIC', { id: 23, name: 'Asistente', email: 'publico@festival.ec', role: 'PUBLIC' }],
    ['ADMIN', { id: 24, name: 'Administrador', email: 'admin@festival.ec', role: 'ADMIN' }],
  ] as const)('deniega la página a un usuario con rol %s', async (_role, user) => {
    saveSession(user);
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ user })));

    renderRoute('/mi-agenda');

    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permisos');
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Agenda del artista' })).not.toBeInTheDocument());
  });
});
