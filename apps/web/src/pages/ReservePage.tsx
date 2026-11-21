import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Spinner } from '../components/ui/Spinner';
import { createReservation, getReservablePerformance, type ReservationConfirmation, type ReservablePerformance } from '../features/reservations/api';
import { ApiError } from '../lib/api';
import { formatDay, formatTime } from '../lib/format';

export function ReservePage() {
  const { performanceId: rawId } = useParams();
  const performanceId = Number(rawId);
  const [performance, setPerformance] = useState<ReservablePerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [reservation, setReservation] = useState<ReservationConfirmation | null>(null);
  const [reserveError, setReserveError] = useState('');

  const loadPerformance = useCallback(async () => {
    if (!Number.isSafeInteger(performanceId) || performanceId <= 0) {
      setLoadError('El identificador de la función no es válido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError('');
    try {
      setPerformance(await getReservablePerformance(performanceId));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No pudimos cargar la función.');
    } finally {
      setLoading(false);
    }
  }, [performanceId]);

  useEffect(() => {
    void loadPerformance();
  }, [loadPerformance]);

  async function handleReserve() {
    setSubmitting(true);
    setReserveError('');
    try {
      setReservation(await createReservation(performanceId, quantity));
    } catch (error) {
      setReserveError(error instanceof ApiError ? error.message : 'No pudimos completar la reserva. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6"><Spinner label="Cargando la función…" /></section>;

  if (loadError || !performance) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-5xl font-black sm:text-6xl">Reservar entradas</h1>
        <div className="mt-8"><ErrorMessage title="No pudimos cargar la función" message={loadError || 'Función no encontrada'} onRetry={() => void loadPerformance()} /></div>
        <p className="mt-8"><Link to="/cartelera">Volver a la cartelera</Link></p>
      </section>
    );
  }

  if (reservation) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6" aria-labelledby="reserva-confirmada">
        <h1 id="reserva-confirmada" className="text-5xl font-black sm:text-6xl">Reserva confirmada</h1>
        <div className="mt-8 border-l-4 border-marigold bg-white p-6 sm:p-8">
          <p className="text-lg">Tu código de reserva es:</p>
          <p className="mt-2 font-display text-5xl font-black tracking-widest text-ink" aria-label={`Código ${reservation.code}`}>
            {reservation.code}
          </p>
          <p className="mt-4">{reservation.quantity} {reservation.quantity === 1 ? 'entrada' : 'entradas'} para <strong>{performance.event.title}</strong>.</p>
          <p className="text-muted">{formatDay(performance.startsAt)} · {formatTime(performance.startsAt)} · {performance.venue.name}</p>
        </div>
        <p className="mt-8"><Link to="/mis-reservas">Ver mis reservas</Link></p>
      </section>
    );
  }

  const maxQuantity = Math.min(6, Math.max(0, performance.availableSeats));

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-5xl font-black sm:text-6xl">Reservar entradas</h1>
      <div className="mt-8 border-l-4 border-marigold bg-white p-6 sm:p-8">
        <h2 className="text-4xl font-bold">{performance.event.title}</h2>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div><dt className="font-bold">Fecha</dt><dd>{formatDay(performance.startsAt)}</dd></div>
          <div><dt className="font-bold">Hora</dt><dd>{formatTime(performance.startsAt)}</dd></div>
          <div><dt className="font-bold">Escenario</dt><dd>{performance.venue.name}</dd></div>
          <div><dt className="font-bold">Disponibilidad</dt><dd>{performance.availableSeats} de {performance.capacity} entradas</dd></div>
        </dl>
      </div>

      {reserveError && <p className="mt-6 border-l-4 border-theater bg-white px-5 py-4 font-bold" role="alert">{reserveError}</p>}

      {maxQuantity === 0 ? (
        <p className="mt-6 border-l-4 border-theater bg-white px-5 py-4 font-bold" role="status">Esta función está agotada.</p>
      ) : (
        <div className="mt-8 max-w-xl space-y-5">
          <div>
            <label htmlFor="reservation-quantity" className="mb-1 block font-bold">Cantidad de entradas</label>
            <select
              id="reservation-quantity"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="w-full rounded border border-line bg-white px-3 py-2 text-ink sm:w-48"
            >
              {Array.from({ length: maxQuantity }, (_, index) => index + 1).map((amount) => (
                <option key={amount} value={amount}>{amount}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => void handleReserve()}
            disabled={submitting}
            className="rounded bg-marigold px-5 py-2.5 font-bold text-ink hover:bg-white disabled:opacity-60"
          >
            {submitting ? 'Confirmando…' : 'Confirmar reserva'}
          </button>
        </div>
      )}
      <p className="mt-8"><Link to="/cartelera">Volver a la cartelera</Link></p>
    </section>
  );
}
