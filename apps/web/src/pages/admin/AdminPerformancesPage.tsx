import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Spinner } from '../../components/ui/Spinner';
import { ConfirmDialog } from '../../features/admin/components/ConfirmDialog';
import { DataTable, type DataTableColumn } from '../../features/admin/components/DataTable';
import { EntityForm, type EntityFormValues } from '../../features/admin/components/EntityForm';
import {
  cancelAdminPerformance,
  createAdminPerformance,
  deleteAdminPerformance,
  getAdminEvents,
  getAdminPerformances,
  getAdminVenues,
  updateAdminPerformance,
  type AdminEvent,
  type AdminPerformance,
  type AdminPerformanceInput,
  type AdminVenue,
} from '../../features/admin/api';
import { ApiError } from '../../lib/api';
import { formatDay, formatTime, FESTIVAL_TIME_ZONE } from '../../lib/format';
import { disciplineLabel } from '../../lib/labels';

const performanceFields = [
  { name: 'eventId', label: 'Obra', type: 'select' as const, required: true },
  { name: 'venueId', label: 'Escenario', type: 'select' as const, required: true },
  { name: 'startsAt', label: 'Fecha y hora', type: 'datetime-local' as const, required: true },
  { name: 'capacity', label: 'Aforo', type: 'number' as const, min: 1, step: 1, required: true },
  {
    name: 'status',
    label: 'Estado',
    type: 'select' as const,
    required: true,
    options: [
      { value: 'SCHEDULED', label: 'Programada' },
      { value: 'CANCELLED', label: 'Cancelada' },
    ],
  },
];

function dateTimeInputValue(iso: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: FESTIVAL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function toFormValues(performance?: AdminPerformance): EntityFormValues {
  return {
    eventId: performance ? String(performance.eventId) : '',
    venueId: performance ? String(performance.venueId) : '',
    startsAt: performance ? dateTimeInputValue(performance.startsAt) : '',
    capacity: performance ? String(performance.capacity) : '',
    status: performance?.status ?? 'SCHEDULED',
  };
}

function toPerformanceInput(values: EntityFormValues): AdminPerformanceInput {
  const localDateTime = values.startsAt;
  return {
    eventId: Number(values.eventId),
    venueId: Number(values.venueId),
    startsAt: new Date(`${localDateTime}:00-05:00`).toISOString(),
    capacity: Number(values.capacity),
    status: values.status as AdminPerformanceInput['status'],
  };
}

function getFieldErrors(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 400) return {};
  return Object.fromEntries(error.details.flatMap((detail) => {
    if (typeof detail !== 'object' || detail === null || !('path' in detail) || !('message' in detail)) return [];
    if (typeof detail.path !== 'string' || typeof detail.message !== 'string') return [];
    return [[detail.path, detail.message]];
  }));
}

export function AdminPerformancesPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [performances, setPerformances] = useState<AdminPerformance[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [venues, setVenues] = useState<AdminVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingPerformance, setEditingPerformance] = useState<AdminPerformance | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminPerformance | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<AdminPerformance | null>(null);
  const [cancelError, setCancelError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [items, eventItems, venueItems] = await Promise.all([
        getAdminPerformances(), getAdminEvents(), getAdminVenues(),
      ]);
      setPerformances(items);
      setEvents(eventItems);
      setVenues(venueItems);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No pudimos cargar las funciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function startCreate() {
    setEditingPerformance(null);
    setFormErrors({});
    setFormError('');
    setSuccessMessage('');
    setShowForm(true);
  }

  function startEdit(performance: AdminPerformance) {
    setEditingPerformance(performance);
    setFormErrors({});
    setFormError('');
    setSuccessMessage('');
    setShowForm(true);
  }

  async function savePerformance(values: EntityFormValues) {
    setSaving(true);
    setFormErrors({});
    setFormError('');
    try {
      const input = toPerformanceInput(values);
      if (editingPerformance) {
        await updateAdminPerformance(editingPerformance.id, input);
        setSuccessMessage(input.status === 'CANCELLED'
          ? 'Función cancelada y reservas confirmadas canceladas.'
          : 'Función actualizada correctamente.');
      } else {
        await createAdminPerformance(input);
        setSuccessMessage('Función creada correctamente.');
      }
      setShowForm(false);
      setEditingPerformance(null);
      await loadData();
      headingRef.current?.focus();
    } catch (error) {
      setFormErrors(getFieldErrors(error));
      setFormError(error instanceof Error ? error.message : 'No pudimos guardar la función.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError('');
    try {
      const result = await cancelAdminPerformance(cancelTarget.id);
      setPerformances((current) => current.map((item) => item.id === cancelTarget.id
        ? result.performance
        : item));
      setSuccessMessage(`Función cancelada. ${result.cancelledReservations} reservas confirmadas cambiaron a canceladas.`);
      setCancelTarget(null);
      headingRef.current?.focus();
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : 'No pudimos cancelar la función.');
    } finally {
      setCancelling(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAdminPerformance(deleteTarget.id);
      setPerformances((current) => current.filter((item) => item.id !== deleteTarget.id));
      setSuccessMessage('Función eliminada correctamente.');
      setDeleteTarget(null);
      headingRef.current?.focus();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'No pudimos eliminar la función.');
    } finally {
      setDeleting(false);
    }
  }

  const columns: DataTableColumn<AdminPerformance>[] = [
    {
      key: 'event',
      header: 'Obra',
      render: (performance) => <><span className="font-bold">{performance.event.title}</span><span className="block text-sm text-muted">{disciplineLabel(performance.event.discipline)}</span></>,
    },
    { key: 'venue', header: 'Escenario', render: (performance) => performance.venue.name },
    { key: 'startsAt', header: 'Fecha y hora', render: (performance) => `${formatDay(performance.startsAt)} · ${formatTime(performance.startsAt)}` },
    { key: 'capacity', header: 'Aforo / reservas', render: (performance) => `${performance.reservedSeats} / ${performance.capacity} (escenario: ${performance.venue.capacity})` },
    { key: 'status', header: 'Estado', render: (performance) => performance.status === 'SCHEDULED' ? 'Programada' : 'Cancelada' },
  ];

  const fields = performanceFields.map((field) => {
    if (field.name === 'eventId') return { ...field, options: events.map((event) => ({ value: String(event.id), label: event.title })) };
    if (field.name === 'venueId') return { ...field, options: venues.map((venue) => ({ value: String(venue.id), label: `${venue.name} · aforo ${venue.capacity}` })) };
    return field;
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="admin-performances-title">
      <p className="mb-4"><Link to="/admin">Administración</Link></p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-bold uppercase tracking-wide text-muted">Administración</p>
          <h1 ref={headingRef} id="admin-performances-title" tabIndex={-1} className="mt-2 text-5xl font-black sm:text-6xl">Funciones</h1>
        </div>
        {!showForm && <button type="button" onClick={startCreate} className="rounded bg-marigold px-5 py-2.5 font-bold text-ink">Agregar función</button>}
      </div>

      {successMessage && <p className="mt-6 border-l-4 border-teal bg-white px-5 py-4 font-bold" role="status">{successMessage}</p>}
      {loading && <div className="mt-8"><Spinner label="Cargando funciones…" /></div>}
      {!loading && loadError && <div className="mt-8"><ErrorMessage message={loadError} onRetry={() => void loadData()} /></div>}

      {showForm && (
        <div className="mt-8 border-l-4 border-marigold bg-white p-5 sm:p-8">
          <h2 className="mb-6 text-4xl font-bold">{editingPerformance ? 'Editar función' : 'Nueva función'}</h2>
          {formError && <p className="mb-5 border-l-4 border-theater px-4 py-3 font-bold" role="alert">{formError}</p>}
          <EntityForm
            key={editingPerformance?.id ?? 'new-performance'}
            fields={fields}
            initialValues={toFormValues(editingPerformance ?? undefined)}
            errors={formErrors}
            busy={saving}
            submitLabel={editingPerformance ? 'Guardar cambios' : 'Crear función'}
            onSubmit={savePerformance}
            onCancel={() => {
              setShowForm(false);
              setEditingPerformance(null);
              setFormError('');
              headingRef.current?.focus();
            }}
          />
        </div>
      )}

      {!loading && !loadError && (
        <div className="mt-8">
          <DataTable
            ariaLabel="Funciones administradas"
            rows={performances}
            getRowKey={(performance) => performance.id}
            columns={columns}
            emptyMessage="Todavía no hay funciones programadas."
            renderActions={(performance) => (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => startEdit(performance)} className="rounded border border-ink px-3 py-1.5 font-bold">Editar</button>
                <Link to={`/admin/performances/${performance.id}/reservations`} className="rounded border border-ink px-3 py-1.5 font-bold">Reservas</Link>
                {performance.status === 'SCHEDULED' && (
                  <button type="button" onClick={() => { setCancelTarget(performance); setCancelError(''); }} className="rounded border border-theater px-3 py-1.5 font-bold text-theater">Cancelar función</button>
                )}
                <button type="button" onClick={() => { setDeleteTarget(performance); setDeleteError(''); }} className="rounded border border-theater px-3 py-1.5 font-bold text-theater">Eliminar</button>
              </div>
            )}
          />
        </div>
      )}

      {cancelTarget && (
        <ConfirmDialog
          title="¿Cancelar función?"
          description={`La función ${cancelTarget.event.title} quedará cancelada y sus reservas confirmadas pasarán a canceladas. El historial se conservará.`}
          confirmLabel="Sí, cancelar función"
          busy={cancelling}
          error={cancelError}
          fallbackFocusRef={headingRef}
          onConfirm={() => void confirmCancel()}
          onCancel={() => setCancelTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="¿Eliminar función?"
          description={`Se eliminará la función ${deleteTarget.event.title}. Si tiene reservas asociadas, la API rechazará el borrado para conservar su historial.`}
          confirmLabel="Sí, eliminar función"
          busy={deleting}
          error={deleteError}
          fallbackFocusRef={headingRef}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </section>
  );
}
