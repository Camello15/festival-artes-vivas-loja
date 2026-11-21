import { Outlet } from 'react-router';
import { Footer } from './Footer';
import { Header } from './Header';
import { SkipLink } from './SkipLink';

// Estructura común: enlace de salto, encabezado, contenido principal y pie.
export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
