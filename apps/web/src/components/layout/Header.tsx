import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { MAIN_NAV } from './navigation';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'block px-1 py-2 text-lg no-underline md:text-base',
    'border-b-2 transition-colors',
    isActive ? 'border-marigold text-white' : 'border-transparent text-white/80 hover:text-white',
  ].join(' ');

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Cierra el menú móvil al cambiar de página.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="on-dark bg-ink text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="font-display text-2xl leading-none font-black tracking-wide text-white no-underline"
        >
          Artes Vivas <span className="text-marigold">Loja</span>
        </Link>

        <button
          type="button"
          className="rounded border border-white/40 px-3 py-1.5 text-sm font-bold md:hidden"
          aria-expanded={menuOpen}
          aria-controls="menu-principal"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? 'Cerrar menú' : 'Menú'}
        </button>

        <nav
          id="menu-principal"
          aria-label="Principal"
          className={`${menuOpen ? 'block' : 'hidden'} w-full md:block md:w-auto`}
        >
          <ul className="flex flex-col gap-1 pt-3 pb-2 md:flex-row md:gap-6 md:p-0">
            {MAIN_NAV.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={navLinkClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li className="md:ml-2">
              <NavLink
                to="/ingresar"
                className="mt-2 inline-block rounded bg-marigold px-4 py-2 font-bold text-ink no-underline md:mt-0 md:py-1.5"
              >
                Ingresar
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
