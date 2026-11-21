import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Spinner } from '../components/ui/Spinner';
import { getVenues } from '../features/catalog/api';
import type { VenueListItem } from '../features/catalog/types';
import { ApiError } from '../lib/api';

export function VenuesPage() {
  const [venues, setVenues] = useState<VenueListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getVenues()
      .then((items) => {
        if (!active) return;
        setVenues(items);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof ApiError
            ? err.message
            : 'No pudimos cargar los escenarios del festival.',
        );
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  return (
    <section aria-labelledby="titulo-escenarios" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 id="titulo-escenarios" className="font-display text-4xl font-black text-ink sm:text-5xl">
          Escenarios
        </h1>
        <p className="mt-2 max-w-prose text-muted">
          Teatros, plazas y espacios culturales de Loja donde se desarrolla el festival.
        </p>
      </header>

      {loading && <Spinner label="Cargando escenarios…" />}

      {!loading && error && (
        <ErrorMessage message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      )}

      {!loading && !error && venues.length > 0 && (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <li key={venue.id}>
              <Link
                to={`/escenarios/${venue.id}`}
                className="group flex h-full flex-col justify-between rounded-lg border border-line bg-white p-5 no-underline hover:border-teal"
              >
                <div>
                  <h2 className="font-display text-2xl font-bold text-ink group-hover:text-teal group-hover:underline">
                    {venue.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted">{venue.address}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-wide text-teal">
                    Capacidad: {venue.capacity} personas
                  </p>
                </div>

                <span className="mt-5 text-sm font-bold text-ink">
                  Ver mapa y funciones →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
