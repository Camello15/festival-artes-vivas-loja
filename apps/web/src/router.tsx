import { createBrowserRouter, type RouteObject } from 'react-router';
import { Layout } from './components/layout/Layout';

import { ArtistDetailPage } from './pages/ArtistDetailPage';
import { ArtistsPage } from './pages/ArtistsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProgramPage } from './pages/ProgramPage';
import { VenueDetailPage } from './pages/VenueDetailPage';
import { VenuesPage } from './pages/VenuesPage';

import { AuthProvider } from './features/auth/AuthContext';
import { ProtectedRoute } from './features/auth/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ReservePage } from './pages/ReservePage';
import { MyReservationsPage } from './pages/MyReservationsPage';
import { ArtistAgendaPage } from './pages/ArtistAgendaPage';
import { AdminVenuesPage } from './pages/admin/AdminVenuesPage';
import { AdminArtistsPage } from './pages/admin/AdminArtistsPage';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminPerformancesPage } from './pages/admin/AdminPerformancesPage';
import { AdminPerformanceReservationsPage } from './pages/admin/AdminPerformanceReservationsPage';
import { AdminLayout } from './pages/admin/AdminLayout';

import { AdminPage } from './pages/placeholders';

// Todas las rutas de la aplicación. Las URL están en español porque las ve el público.
export const routes: RouteObject[] = [
  {
    element: (
      <AuthProvider>
        <Layout />
      </AuthProvider>
    ),
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
      {
        path: 'reservar/:performanceId',
        element: <ProtectedRoute><ReservePage /></ProtectedRoute>,
      },
      {
        path: 'mis-reservas',
        element: <ProtectedRoute><MyReservationsPage /></ProtectedRoute>,
      },
      {
        path: 'mi-agenda',
        element: <ProtectedRoute roles={['ARTIST']}><ArtistAgendaPage /></ProtectedRoute>,
      },
      {
        path: 'admin',
        element: <ProtectedRoute roles={['ADMIN']}><AdminLayout /></ProtectedRoute>,
        children: [
          { index: true, element: <AdminPage /> },
          { path: 'venues', element: <AdminVenuesPage /> },
          { path: 'artists', element: <AdminArtistsPage /> },
          { path: 'events', element: <AdminEventsPage /> },
          { path: 'performances', element: <AdminPerformancesPage /> },
          { path: 'performances/:id/reservations', element: <AdminPerformanceReservationsPage /> },
          { path: '*', element: <AdminPage /> },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
