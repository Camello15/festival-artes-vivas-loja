import { createBrowserRouter, type RouteObject } from 'react-router';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import {
  AdminPage,
  ArtistAgendaPage,
  ArtistDetailPage,
  ArtistsPage,
  EventDetailPage,
  LoginPage,
  MyReservationsPage,
  ProgramPage,
  RegisterPage,
  ReservePage,
  VenueDetailPage,
  VenuesPage,
} from './pages/placeholders';

// Todas las rutas de la aplicación. Las URL están en español porque las ve el público.
export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },

      // Spec #2: Cartelera y detalle
      { path: 'cartelera', element: <ProgramPage /> },
      { path: 'obras/:id', element: <EventDetailPage /> },
      { path: 'artistas', element: <ArtistsPage /> },
      { path: 'artistas/:id', element: <ArtistDetailPage /> },
      { path: 'escenarios', element: <VenuesPage /> },
      { path: 'escenarios/:id', element: <VenueDetailPage /> },

      // Spec #3: Reservas y administración
      { path: 'ingresar', element: <LoginPage /> },
      { path: 'registro', element: <RegisterPage /> },
      { path: 'reservar/:performanceId', element: <ReservePage /> },
      { path: 'mis-reservas', element: <MyReservationsPage /> },
      { path: 'mi-agenda', element: <ArtistAgendaPage /> },
      { path: 'admin/*', element: <AdminPage /> },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
