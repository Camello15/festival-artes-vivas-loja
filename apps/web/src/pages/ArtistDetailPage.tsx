import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Spinner } from '../components/ui/Spinner';
import { getArtistById } from '../features/catalog/api';
import type { ArtistDetail } from '../features/catalog/types';
import { ApiError } from '../lib/api';
import { artistKindLabel, disciplineColorVar, disciplineLabel } from '../lib/labels';

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function ArtistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
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

    getArtistById(id)
      .then((data) => {
        if (!active) return;
        setArtist(data);
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
              : 'No pudimos cargar el perfil del artista.',
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
        <Spinner label="Cargando perfil del artista…" />
      </div>
    );
  }

  if (notFound) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-4xl font-black text-ink">Artista no encontrado</h1>
        <p className="mt-3 text-muted">
          El artista o compañía que buscas no figura en la programación.
        </p>
        <p className="mt-6">
          <Link
            to="/artistas"
            className="inline-block rounded bg-ink px-5 py-2.5 text-sm font-bold text-white no-underline hover:bg-teal"
          >
            Ver todos los artistas
          </Link>
        </p>
      </section>
    );
  }

  if (error || !artist) {
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
    <article aria-labelledby="titulo-artista" className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-muted">
        <Link to="/artistas" className="hover:text-teal hover:underline">
          ← Volver a artistas y compañías
        </Link>
      </nav>

      <header className="grid gap-8 md:grid-cols-[14rem_1fr] md:items-start">
        {artist.imageUrl ? (
          <img
            src={artist.imageUrl}
            alt={artist.name}
            className="aspect-square w-full max-w-[14rem] rounded-lg border border-line object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex aspect-square w-full max-w-[14rem] items-center justify-center rounded-lg bg-ink font-display text-5xl font-black text-marigold"
          >
            {getInitials(artist.name)}
          </div>
        )}

        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-teal">
            {artistKindLabel(artist.kind)} · {artist.country}
          </p>
          <h1
            id="titulo-artista"
            className="mt-2 font-display text-4xl font-black text-ink sm:text-5xl"
          >
            {artist.name}
          </h1>

          {artist.bio && (
            <p className="mt-4 max-w-prose text-base leading-relaxed text-ink/90">{artist.bio}</p>
          )}

          {artist.website && (
            <p className="mt-4">
              <a
                href={artist.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-bold text-teal underline hover:text-ink"
              >
                Sitio web oficial ↗
              </a>
            </p>
          )}
        </div>
      </header>

      <section aria-labelledby="titulo-obras-artista" className="mt-12 border-t border-line pt-8">
        <h2
          id="titulo-obras-artista"
          className="font-display text-2xl font-bold text-ink sm:text-3xl"
        >
          Obras en el festival
        </h2>

        {artist.events.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No tiene obras asignadas por el momento.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {artist.events.map((ev) => (
              <li key={ev.id}>
                <Link
                  to={`/obras/${ev.id}`}
                  className="flex items-center justify-between rounded-lg border border-line bg-white p-4 no-underline hover:border-teal"
                >
                  <div>
                    <span
                      style={{ backgroundColor: `var(${disciplineColorVar(ev.discipline)})` }}
                      className="inline-block rounded px-2 py-0.5 text-xs font-bold text-white"
                    >
                      {disciplineLabel(ev.discipline)}
                    </span>
                    <span className="mt-1.5 block font-display text-xl font-bold text-ink">
                      {ev.title}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-teal">Ver obra →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
