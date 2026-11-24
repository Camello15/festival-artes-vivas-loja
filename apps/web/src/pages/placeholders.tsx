import { ComingSoon } from '../components/ui/ComingSoon';

// Pantallas reservadas. Cada spec reemplaza su placeholder por la página real
// en router.tsx (ver specs/002-cartelera/tasks.md y specs/003-reservas/tasks.md).

// ---- Spec #2: Cartelera y detalle ----
export const ProgramPage = () => (
  <ComingSoon spec={2} title="Cartelera" description="Todas las funciones del festival por día, con filtros por fecha, disciplina y escenario." />
);
export const EventDetailPage = () => (
  <ComingSoon spec={2} title="Detalle de la obra" description="Sinopsis, duración, artistas y todas las funciones de la obra." />
);
export const ArtistsPage = () => (
  <ComingSoon spec={2} title="Artistas y compañías" description="Quiénes se presentan en el festival y de dónde vienen." />
);
export const ArtistDetailPage = () => (
  <ComingSoon spec={2} title="Artista" description="Biografía del artista o compañía y las obras que presenta." />
);
export const VenuesPage = () => (
  <ComingSoon spec={2} title="Escenarios" description="Teatros, plazas y parques del festival con su dirección." />
);
export const VenueDetailPage = () => (
  <ComingSoon spec={2} title="Escenario" description="Ubicación en el mapa, cómo llegar y próximas funciones." />
);

// ---- Spec #3: Reservas y administración ----
export const AdminPage = () => (
  <ComingSoon spec={3} title="Administración" description="Gestión de obras, funciones, artistas y escenarios, y lista de reservas por función." />
);
