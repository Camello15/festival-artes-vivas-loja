import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Spinner } from '../components/ui/Spinner';
import { getVenueById } from '../features/catalog/api';
import { PerformanceCard } from '../features/catalog/components/PerformanceCard';
import { VenueMap } from '../features/catalog/components/VenueMap';
import type { VenueDetail } from '../features/catalog/types';
import { ApiError } from '../lib/api';

export function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setNotFound(false);
    setError(null);

    getVenueById(id)
      .then((data) => {
        if (!active) return;
        setVenue(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
          setNotFound(true);
        } else {
          setError(
            err instanceof ApiError
              ? err.message
              : 'No pudimos cargar la información del escenario.',
          );
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Spinner label="Cargando escenario…" />
      </div>
    );
  }

  if (notFound) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-4xl font-black text-ink">Escenario no encontrado</h1>
        <p className="mt-3 text-muted">
          El escenario que buscas no figura en la programación del festival.
        </p>
        <p className="mt-6">
          <Link
            to="/escenarios"
            className="inline-block rounded bg-ink px-5 py-2.5 text-sm font-bold text-white no-underline hover:bg-teal"
          >
            Ver todos los escenarios
          </Link>
        </p>
      </section>
    );
  }

  if (error || !venue) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <ErrorMessage
          message={error ?? 'Ocurrió un error inesperado.'}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </div>
    );
  }

  return (
    <article aria-labelledby="titulo-escenario" className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-muted">
        <Link to="/escenarios" className="hover:text-teal hover:underline">
          ← V← Volver a escenarios
        </Link>
      </nav>

      <header className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wide text-teal">
          Capacidad: {venue.capacity} personas
        </p>
        <h1
          id="titulo-escenario"
          className="mt-2 font-display text-4xl font-black text-ink sm:text-5xl"
        >
          {venue.name}
        </h1>
        <p className="mt-2 text-base font-medium text-ink">{venue.address}</p>
        {venue.description && (
          <p className="mt-4 max-w-prose text-base leading-relaxed text-muted">
            {venue.description}
          </p>
        )}
      </header>

      <section aria-labelledby="titulo-ubicacion" className="mb-12">
        <h2 id="titulo-ubicacion" className="mb-4 font-display text-2xl font-bold text-ink">
          Ubicación
        </h2>
        <VenueMap
          name={venue.name}
          address={venue.address}
          latitude={venue.latitude}
          longitude={venue.longitude}
        />
      </section>

      <section aria-labelledby="titulo-proximas-escenario" className="border-t border-line pt-8">
        <h2
          id="titulo-proximas-escenario"
          className="font-display text-2xl font-bold text-ink sm:text-3xl"
        >
          Próximas funciones en este escenario
        </h2>

        {venue.upcomingPerformances.length === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-white p-6 text-muted">
            No hay funciones próximas programadas en este escenario.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {venue.upcomingPerformances.map((perf) => (
              <li key={perf.id}>
                <PerformanceCard performance={perf} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}

