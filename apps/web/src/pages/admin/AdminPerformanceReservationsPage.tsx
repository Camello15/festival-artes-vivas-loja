import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Spinner } from '../../components/ui/Spinner';
import { DataTable, type DataTableColumn } from '../../features/admin/components/DataTable';
import { getAdminPerformanceReservations, type AdminPerformanceReservation, type AdminPerformanceReservations } from '../../features/admin/api';
import { ApiError } from '../../lib/api';
import { formatDay, formatTime } from '../../lib/format';

function reservationStatus(status: AdminPerformanceReservation['status']) {
  return status === 'CONFIRMED' ? 'Confirmada' : 'Cancelada';
}

export function AdminPerformanceReservationsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AdminPerformanceReservations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const loadReservations = useCallback(async () => {
    if (!id || !/^\d+$/.test(id)) {
      setError('Identificador de función inválido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setData(await getAdminPerformanceReservations(Number(id)));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No pudimos cargar las reservas.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations, reloadKey]);

  const columns: DataTableColumn<AdminPerformanceReservation>[] = [
    { key: 'code', header: 'Código', render: (reservation) => <span className="font-mono font-bold">{reservation.code}</span> },
    { key: 'user', header: 'Asistente', render: (reservation) => reservation.user.name },
    { key: 'quantity', header: 'Entradas', render: (reservation) => reservation.quantity },
    { key: 'status', header: 'Estado', render: (reservation) => reservationStatus(reservation.status) },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="admin-performance-reservations-title">
      <p className="mb-4"><Link to="/admin/performances">← Volver a funciones</Link></p>
      {loading && <Spinner label="Cargando reservas…" />}
      {!loading && error && <ErrorMessage message={error} onRetry={() => setReloadKey((key) => key + 1)} />}
      {!loading && !error && data && (
        <>
          <p className="font-bold uppercase tracking-wide text-muted">Administración · Funciones</p>
          <h1 id="admin-performance-reservations-title" className="mt-2 text-4xl font-black sm:text-5xl">Reservas: {data.performance.event.title}</h1>
          <p className="mt-3 text-muted">
            {data.performance.venue.name} · {formatDay(data.performance.startsAt)} · {formatTime(data.performance.startsAt)}
          </p>
          <p className="mt-6 border-l-4 border-teal bg-white px-5 py-4 font-bold" role="status">
            Entradas confirmadas: {data.totalConfirmed} / {data.performance.capacity}
          </p>
          <div className="mt-8">
            <DataTable
              ariaLabel="Reservas de la función"
              rows={data.reservations}
              getRowKey={(reservation) => reservation.id}
              columns={columns}
              emptyMessage="Esta función todavía no tiene reservas."
            />
          </div>
        </>
      )}
    </section>
  );
}
