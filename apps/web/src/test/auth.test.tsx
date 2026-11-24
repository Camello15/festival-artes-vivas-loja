import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setAuthToken, setUnauthorizedHandler } from '../lib/api';
import { renderRoute } from './renderRoute';

const publicUser = { id: 51, name: 'Ana Festival', email: 'ana@festival.ec', role: 'PUBLIC' as const };
const adminUser = { id: 52, name: 'Admin Festival', email: 'admin-nuevo@festival.ec', role: 'ADMIN' as const };

function response(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
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

describe('sesión y pantallas de autenticación', () => {
  it('redirige a ingresar y regresa a la ruta protegida después del login', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(() => response({ token: 'jwt-publico', user: publicUser }));
    vi.stubGlobal('fetch', fetchMock);
    const { router } = renderRoute('/reservar/7');

    expect(await screen.findByRole('heading', { name: 'Ingresar' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/ingresar');
    expect(router.state.location.search).toContain('next=');

    await user.type(screen.getByLabelText('Correo electrónico'), publicUser.email);
    await user.type(screen.getByLabelText('Contraseña'), 'festival2026');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('heading', { name: 'Reservar entradas' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/reservar/7');
    expect(localStorage.getItem('festival-auth')).toContain('jwt-publico');
    expect(screen.getByText('Ana Festival')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Administración' })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }));

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByRole('link', { name: 'Ingresar' })).toBeInTheDocument();
  });

  it('restaura la sesión y muestra administración solo para ADMIN', async () => {
    localStorage.setItem('festival-auth', JSON.stringify({ token: 'jwt-admin', user: adminUser }));
    const fetchMock = vi.fn(() => response({ user: adminUser }));
    vi.stubGlobal('fetch', fetchMock);
    renderRoute('/');

    expect(await screen.findByRole('link', { name: 'Administración' })).toBeInTheDocument();
    expect(screen.getByText('Admin Festival')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', expect.anything()));
  });

  it('crea cuenta mediante el formulario de registro y establece sesión', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(() => response({ token: 'jwt-registro', user: publicUser }, 201));
    vi.stubGlobal('fetch', fetchMock);
    renderRoute('/registro');

    await user.type(screen.getByLabelText('Nombre'), 'Ana Festival');
    await user.type(screen.getByLabelText('Correo electrónico'), publicUser.email);
    await user.type(screen.getByLabelText(/Contraseña/), 'festival2026');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByRole('heading', { name: 'Mis reservas' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({ method: 'POST' }));
    expect(localStorage.getItem('festival-auth')).toContain('jwt-registro');
  });
});
