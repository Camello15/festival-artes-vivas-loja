import { NavLink, Outlet } from 'react-router';

const sections = [
  { to: '.', label: 'Inicio', end: true },
  { to: 'venues', label: 'Escenarios' },
  { to: 'artists', label: 'Artistas' },
  { to: 'events', label: 'Obras' },
  { to: 'performances', label: 'Funciones' },
];

function sectionLinkClass({ isActive }: { isActive: boolean }) {
  return [
    'block rounded px-3 py-2 font-semibold no-underline transition-colors',
    isActive ? 'bg-marigold text-ink' : 'text-ink hover:bg-sand',
  ].join(' ');
}

export function AdminLayout() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 border-b border-ink/15 pb-5">
        <p className="text-sm font-bold uppercase tracking-widest text-ink/60">Festival de Artes Vivas Loja</p>
        <p className="mt-1 font-display text-4xl font-black sm:text-5xl">Administración</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        <nav aria-label="Administración" className="min-w-0">
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {sections.map((section) => (
              <li key={section.to} className="shrink-0 lg:shrink">
                <NavLink to={section.to} end={section.end} className={sectionLinkClass}>
                  {section.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0" aria-label="Contenido de administración">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
