import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderRoute } from './renderRoute';

beforeEach(() => {
  // La página de inicio llama a la API; aquí solo interesa el layout.
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Layout y navegación', () => {
  it('tiene las regiones principales accesibles', () => {
    renderRoute('/');

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('el primer elemento enfocable es "Saltar al contenido"', async () => {
    const user = userEvent.setup();
    renderRoute('/');

    await user.tab();

    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveFocus();
  });

  it('el menú lleva a las secciones de los Specs #2 y #3', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/');
    const nav = screen.getByRole('navigation', { name: 'Principal' });

    await user.click(within(nav).getByRole('link', { name: 'Cartelera' }));

    expect(router.state.location.pathname).toBe('/cartelera');
    expect(screen.getByRole('heading', { level: 1, name: 'Cartelera' })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Filtrar cartelera' })).toBeInTheDocument();
  });

  it('el botón del menú móvil informa si está abierto', async () => {
    const user = userEvent.setup();
    renderRoute('/');
    const button = screen.getByRole('button', { name: 'Menú' });

    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('muestra la página 404 en rutas inexistentes', () => {
    renderRoute('/no-existe');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Esta página no está en la programación' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/');
  });
});
