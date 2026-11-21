import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Spinner } from '../components/ui/Spinner';
import { getArtists } from '../features/catalog/api';
import type { ArtistListItem } from '../features/catalog/types';
import { ApiError } from '../lib/api';
import { artistKindLabel } from '../lib/labels';

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function ArtistsPage() {
  const [search, setSearch] = useState('');
  const [artists, setArtists] = useState<ArtistListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getArtists(search)
      .then((items) => {
        if (!active) return;
        setArtists(items);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof ApiError
            ? err.message
            : 'No pudimos cargar los artistas y compañías.',
        );
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search, reloadKey]);

  return (
    <section aria-labelledby="titulo-artistas" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 id="titulo-artistas" className="font-display text-4xl font-black text-ink sm:text-5xl">
          Artistas y compañías
        </h1>
        <p className="mt-2 max-w-prose text-muted">
          Conoce a los creadores nacionales e internacionales que participan en el festival.
        </p>
      </header>

      <div className="mb-6 max-w-md">
        <label htmlFor="buscar-artista" className="block text-sm font-bold text-ink">
          Buscar por nombre
        </label>
        <input
          id="buscar-artista"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ej. Colectivo, Teatro, Dúo…"
          className="mt-1.5 w-full rounded border border-line bg-white px-3.5 py-2 text-sm text-ink focus:border-teal focus:outline-none"
        />
      </div>

      <div aria-live="polite" className="mb-4 text-sm font-medium text-muted">
        {!loading && !error && (
          <span>
            {artists.length === 1
              ? '1 artista o compañía encontrado'
              : `${artists.length} artistas y compañías encontrados`}
          </span>
        )}
      </div>

      {loading && <Spinner label="Cargando artistas…" />}

      {!loading && error && (
        <ErrorMessage message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      )}

      {!loading && !error && artists.length === 0 && (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <p className="font-display text-2xl font-bold text-ink">
            No encontramos artistas con ese nombre
          </p>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-4 rounded bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-teal"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      )}

      {!loading && !error && artists.length > 0 && (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => (
            <li key={artist.id}>
              <Link
                to={`/artistas/${artist.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white no-underline hover:border-teal"
              >
                {artist.imageUrl ? (
                  <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    className="aspect-[16/10] w-full object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex aspect-[16/10] w-full items-center justify-center bg-ink font-display text-4xl font-black text-marigold"
                  >
                    {getInitials(artist.name)}
                  </div>
                )}

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wide text-teal">
                      {artistKindLabel(artist.kind)} · {artist.country}
                    </span>
                    <h2 className="mt-1 font-display text-2xl font-bold text-ink group-hover:text-teal group-hover:underline">
                      {artist.name}
                    </h2>
                  </div>
                  <span className="mt-4 text-sm font-bold text-ink">Ver biografía y obras →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
