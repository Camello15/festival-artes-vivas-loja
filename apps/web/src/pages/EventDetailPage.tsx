import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Spinner } from '../components/ui/Spinner';
import { getEventById } from '../features/catalog/api';
import { AvailabilityBadge } from '../features/catalog/components/AvailabilityBadge';
import type { EventDetail } from '../features/catalog/types';
import { ApiError } from '../lib/api';
import { formatDay, formatTime } from '../lib/format';
import { artistKindLabel, disciplineColorVar, disciplineLabel } from '../lib/labels';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
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

    getEventById(id)
      .then((data) => {
        if (!active) return;
        setEvent(data);
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
              : 'No pudimos cargar el detalle de la obra.',
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
        <Spinner label="Cargando detalle de la obra…" />
      </div>
    );
  }

  if (notFound) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-4xl font-black text-ink">Obra no encontrada</h1>
        <p className="mt-3 text-muted">
          La obra que buscas no existe o fue retirada de la programación.
        </p>
        <p className="mt-6">
          <Link
            to="/cartelera"
            className="inline-block rounded bg-ink px-5 py-2.5 text-sm font-bold text-white no-underline hover:bg-teal"
          >
            Volver a la cartelera
          </Link>
        </p>
      </section>
    );
  }

  if (error || !event) {
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
    <article aria-labelledby="titulo-obra" className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-muted">
        <Link to="/cartelera" className="hover:text-teal hover:underline">
          ← Volver a la cartelera
        </Link>
      </nav>

      <header className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-start">
        <div>
          <span
            style={{ backgroundColor: `var(${disciplineColorVar(event.discipline)})` }}
            className="inline-block rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white"
          >
            {disciplineLabel(event.discipline)}
          </span>

          <h1
            id="titulo-obra"
            className="mt-3 font-display text-4xl font-black leading-tight text-ink sm:text-5xl"
          >
            {event.title}
          </h1>

          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <div>
              <dt className="inline font-bold text-ink">Duración: </dt>
              <dd className="inline">{event.durationMinutes} minutos</dd>
            </div>
            <div>
              <dt className="inline font-bold text-ink">Clasificación: </dt>
              <dd className="inline">{event.ageRating}</dd>
            </div>
          </dl>

          <p className="mt-6 max-w-prose text-base leading-relaxed text-ink/90">{event.synopsis}</p>
        </div>

        {event.imageUrl && (
          <div className="overflow-hidden rounded-lg border border-line bg-zinc-100">
            <img
              src={event.imageUrl}
              alt={`Escena de la obra ${event.title}`}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        )}
      </header>

      <section aria-labelledby="titulo-artistas-obra" className="mt-12 border-t border-line pt-8">
        <h2 id="titulo-artistas-obra" className="font-display text-2xl font-bold text-ink sm:text-3xl">
          Artistas y compañías
        </h2>
        {event.artists.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Información de elenco por confirmar.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {event.artists.map((artist) => (
              <li key={artist.id}>
                <Link
                  to={`/artistas/${artist.id}`}
                  className="flex items-center justify-between rounded-lg border border-line bg-white p-4 no-underline hover:border-teal"
                >
                  <div>
                    <span className="block font-display text-xl font-bold text-ink">
                      {artist.name}
                    </span>
                    <span className="text-xs text-muted">
                      {artistKindLabel(artist.kind)} · {artist.country}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-teal">Ver perfil →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titulo-funciones-obra" className="mt-12 border-t border-line pt-8">
        <h2 id="titulo-funciones-obra" className="font-display text-2xl font-bold text-ink sm:text-3xl">
          Funciones programadas
        </h2>

        {event.performances.length === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-white p-6 text-muted">
            Sin funciones programadas.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {event.performances.map((perf) => {
              const canReserve = perf.status === 'SCHEDULED' && perf.availableSeats > 0;
              return (
                <li
                  key={perf.id}
                  className="flex flex-col gap-4 rounded-lg border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div>
                    <p className="font-display text-xl font-bold capitalize text-ink">
                      {formatDay(perf.startsAt)} · {formatTime(perf.startsAt)}
                    </p>
                    <p className="mt-1 text-sm">
                      <Link
                        to={`/escenarios/${perf.venue.id}`}
                        className="font-medium text-muted underline-offset-2 hover:text-teal hover:underline"
                      >
                        {perf.venue.name}
                      </Link>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <AvailabilityBadge
                      status={perf.status}
                      availability={perf.availability}
                      availableSeats={perf.availableSeats}
                    />
                    {canReserve && (
                      <Link
                        to={`/reservar/${perf.id}`}
                        className="rounded bg-marigold px-4 py-2 text-sm font-bold text-ink no-underline hover:bg-ink hover:text-white"
                      >
                        Reservar
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </article>
  );
}
