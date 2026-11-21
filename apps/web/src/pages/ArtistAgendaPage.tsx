import { useCallback, useEffect, useState } from 'react';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Spinner } from '../components/ui/Spinner';
import { getArtistPerformances, type ArtistPerformance } from '../features/artist-agenda/api';
import { disciplineLabel } from '../lib/labels';
import { formatDay, formatTime } from '../lib/format';

function performanceStatus(status: ArtistPerformance['status']) {
  return status === 'SCHEDULED' ? 'Programada' : 'Cancelada';
}

export function ArtistAgendaPage() {
  const [performances, setPerformances] = useState<ArtistPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadPerformances = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setPerformances(await getArtistPerformances());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No pudimos cargar tu agenda.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPerformances();
  }, [loadPerformances]);

  const orderedPerformances = [...performances].sort(
    (first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime(),
  );

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6" aria-labelledby="artist-agenda-title">
      <h1 id="artist-agenda-title" className="text-5xl font-black sm:text-6xl">Agenda del artista</h1>
      <p className="mt-4 max-w-prose text-lg">Consulta tus próximas presentaciones, escenarios y entradas confirmadas.</p>

      {loading && <div className="mt-8"><Spinner label="Cargando tu agenda…" /></div>}
      {!loading && loadError && (
        <div className="mt-8"><ErrorMessage message={loadError} onRetry={() => void loadPerformances()} /></div>
      )}
      {!loading && !loadError && orderedPerformances.length === 0 && (
        <div className="mt-8 border-l-4 border-marigold bg-white p-6">
          <p className="font-bold">Todavía no tienes funciones en tu agenda.</p>
          <p className="mt-2 text-muted">Si esperabas ver una función, verifica que tu cuenta tenga un perfil de artista vinculado.</p>
        </div>
      )}

      {!loading && !loadError && orderedPerformances.length > 0 && (
        <ul className="mt-8 space-y-5">
          {orderedPerformances.map((performance) => (
            <li key={performance.id} className="border-l-4 border-marigold bg-white p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-4">
                  {performance.event.imageUrl && (
                    <img
                      src={performance.event.imageUrl}
                      alt=""
                      className="hidden size-20 rounded object-cover sm:block"
                    />
                  )}
                  <div>
                    <h2 className="font-display text-3xl font-bold">{performance.event.title}</h2>
                    <p className="mt-1 text-muted">
                      {disciplineLabel(performance.event.discipline)} · {performance.event.durationMinutes} min
                    </p>
                  </div>
                </div>
                <span className={`rounded px-3 py-1 text-sm font-bold ${performance.status === 'SCHEDULED' ? 'bg-marigold/30 text-ink' : 'bg-line text-muted'}`}>
                  {performanceStatus(performance.status)}
                </span>
              </div>

              <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                <div><dt className="font-bold">Fecha</dt><dd>{formatDay(performance.startsAt)}</dd></div>
                <div><dt className="font-bold">Hora</dt><dd>{formatTime(performance.startsAt)}</dd></div>
                <div><dt className="font-bold">Escenario</dt><dd>{performance.venue.name}</dd></div>
                <div>
                  <dt className="font-bold">Entradas confirmadas</dt>
                  <dd>{performance.reservedSeats} / {performance.capacity}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
