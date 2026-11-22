import { Router } from 'express';
import { healthRouter } from '../modules/health/health.routes';
import { festivalRouter } from '../modules/festival/festival.routes';

import { authRouter } from '../modules/auth/auth.routes';
import { reservationsRouter } from '../modules/reservations/reservations.routes';
import { adminVenuesRouter } from '../modules/admin/venues/admin-venues.routes';
import { adminArtistsRouter } from '../modules/admin/artists/admin-artists.routes';
import { adminEventsRouter } from '../modules/admin/events/admin-events.routes';
import { adminPerformancesRouter } from '../modules/admin/performances/admin-performances.routes';
import { artistAgendaRouter } from '../modules/artist-agenda/artist-agenda.routes';

import { performancesRouter } from '../modules/performances/performances.routes';
import { eventsRouter } from '../modules/events/events.routes';
import { artistsRouter } from '../modules/artists/artists.routes';
import { venuesRouter } from '../modules/venues/venues.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/festival', festivalRouter);

// Spec #3: autenticación y reservas
apiRouter.use('/auth', authRouter);
apiRouter.use('/reservations', reservationsRouter);
apiRouter.use('/me/artist/performances', artistAgendaRouter);
apiRouter.use('/admin/venues', adminVenuesRouter);
apiRouter.use('/admin/artists', adminArtistsRouter);
apiRouter.use('/admin/events', adminEventsRouter);
apiRouter.use('/admin/performances', adminPerformancesRouter);

// Spec #2: cartelera y catálogo
apiRouter.use('/performances', performancesRouter);
apiRouter.use('/events', eventsRouter);
apiRouter.use('/artists', artistsRouter);
apiRouter.use('/venues', venuesRouter);
