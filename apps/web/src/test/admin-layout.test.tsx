import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setAuthToken, setUnauthorizedHandler } from '../lib/api';
import { renderRoute } from './renderRoute';

const admin = { id: 1, name: 'Admin Festival', email: 'admin@festival.ec', role: 'ADMIN' as const };
const publicUser = { id: 2, name: 'Ana Festival', email: 'ana@festival.ec', role: 'PUBLIC' as const };

function response(body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }));
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

describe('AdminLayout', () => {
  it('muestra navegación compartida para ADMIN y conserva la página de inicio', async () => {
    localStorage.setItem('festival-auth', JSON.stringify({ token: 'jwt-admin', user: admin }));
    vi.stubGlobal('fetch', vi.fn(() => response({ user: admin })));

    renderRoute('/admin');

    expect(await screen.findByRole('link', { name: 'Inicio' })).toBeInTheDocument();
    const navigation = screen.getByRole('navigation', { name: 'Administración' });
    expect(within(navigation).getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/admin');
    expect(within(navigation).getByRole('link', { name: 'Escenarios' })).toHaveAttribute('href', '/admin/venues');
    expect(within(navigation).getByRole('link', { name: 'Artistas' })).toHaveAttribute('href', '/admin/artists');
    expect(within(navigation).getByRole('link', { name: 'Obras' })).toHaveAttribute('href', '/admin/events');
    expect(within(navigation).getByRole('link', { name: 'Funciones' })).toHaveAttribute('href', '/admin/performances');
    expect(screen.getByText(/Gestión de obras/)).toBeInTheDocument();
  });

  it('redirige a ingresar cuando falta la sesión y comunica falta de permisos a PUBLIC', async () => {
    vi.stubGlobal('fetch', vi.fn(() => response({ user: publicUser })));
    const anonymous = renderRoute('/admin/venues');
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).toBeInTheDocument();
    expect(anonymous.router.state.location.pathname).toBe('/ingresar');
    expect(anonymous.router.state.location.search).toContain(encodeURIComponent('/admin/venues'));

    localStorage.setItem('festival-auth', JSON.stringify({ token: 'jwt-public', user: publicUser }));
    renderRoute('/admin');
    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permisos');
  });
});
