import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Spinner } from '../components/ui/Spinner';
import { cancelReservation, getMyReservations, type MyReservation } from '../features/reservations/api';
import { ConfirmDialog } from '../features/reservations/components/ConfirmDialog';
import { ApiError } from '../lib/api';
import { formatDay, formatTime } from '../lib/format';

function canCancel(reservation: MyReservation) {
  return reservation.status === 'CONFIRMED' && new Date(reservation.performance.startsAt).getTime() > Date.now();
}

function reservationStatus(status: MyReservation['status']) {
  return status === 'CONFIRMED' ? 'Confirmada' : 'Cancelada';
}

export function MyReservationsPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [reservations, setReservations] = useState<MyReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [cancelTarget, setCancelTarget] = useState<MyReservation | null>(null);
  const [cancelError, setCancelError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadReservations = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setReservations(await getMyReservations());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No pudimos cargar tus reservas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  async function confirmCancellation() {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError('');
    try {
      const updated = await cancelReservation(cancelTarget.id);
      setReservations((current) => current.map((reservation) => reservation.id === updated.id ? updated : reservation));
      setCancelTarget(null);
    } catch (error) {
      setCancelError(error instanceof ApiError ? error.message : 'No pudimos cancelar la reserva. Intenta de nuevo.');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6" aria-labelledby="mis-reservas-title">
      <h1 ref={headingRef} id="mis-reservas-title" tabIndex={-1} className="text-5xl font-black sm:text-6xl">Mis reservas</h1>
      <p className="mt-4 max-w-prose text-lg">Consulta tus códigos de entrada y libera un cupo si ya no asistirás.</p>

      {loading && <div className="mt-8"><Spinner label="Cargando tus reservas…" /></div>}
      {!loading && loadError && (
        <div className="mt-8"><ErrorMessage message={loadError} onRetry={() => void loadReservations()} /></div>
      )}
      {!loading && !loadError && reservations.length === 0 && (
        <div className="mt-8 border-l-4 border-marigold bg-white p-6">
          <p>Todavía no tienes reservas.</p>
          <p className="mt-3"><Link to="/cartelera">Explorar la cartelera</Link></p>
        </div>
      )}

      {!loading && !loadError && reservations.length > 0 && (
        <ul className="mt-8 space-y-5">
          {reservations.map((reservation) => (
            <li key={reservation.id} className="border-l-4 border-marigold bg-white p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-3xl font-bold">{reservation.performance.event.title}</p>
                  <p className="mt-1 text-muted">{formatDay(reservation.performance.startsAt)} · {formatTime(reservation.performance.startsAt)}</p>
                </div>
                <span className={`rounded px-3 py-1 text-sm font-bold ${reservation.status === 'CONFIRMED' ? 'bg-marigold/30 text-ink' : 'bg-line text-muted'}`}>
                  {reservationStatus(reservation.status)}
                </span>
              </div>
              <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                <div><dt className="font-bold">Código</dt><dd className="font-mono text-lg">{reservation.code}</dd></div>
                <div><dt className="font-bold">Entradas</dt><dd>{reservation.quantity}</dd></div>
                <div><dt className="font-bold">Escenario</dt><dd>{reservation.performance.venue.name}</dd></div>
                <div><dt className="font-bold">Dirección</dt><dd>{reservation.performance.venue.address}</dd></div>
              </dl>
              {canCancel(reservation) && (
                <button
                  type="button"
                  onClick={() => {
                    setCancelTarget(reservation);
                    setCancelError('');
                  }}
                  className="mt-6 rounded border border-ink px-4 py-2 font-bold text-ink hover:bg-paper"
                >
                  Cancelar reserva {reservation.code}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {cancelTarget && (
        <ConfirmDialog
          title="¿Cancelar esta reserva?"
          description={`La reserva ${cancelTarget.code} para ${cancelTarget.performance.event.title} pasará a estado Cancelada. Esta acción libera sus entradas.`}
          confirmLabel="Sí, cancelar reserva"
          busy={cancelling}
          error={cancelError}
          fallbackFocusRef={headingRef}
          onConfirm={() => void confirmCancellation()}
          onCancel={() => setCancelTarget(null)}
        />
      )}
    </section>
  );
}
