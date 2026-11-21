import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Spinner } from '../../components/ui/Spinner';
import { ConfirmDialog } from '../../features/admin/components/ConfirmDialog';
import { DataTable, type DataTableColumn } from '../../features/admin/components/DataTable';
import { EntityForm, type EntityFormValues } from '../../features/admin/components/EntityForm';
import {
  createAdminEvent,
  deleteAdminEvent,
  getAdminArtists,
  getAdminEvents,
  updateAdminEvent,
  type AdminArtist,
  type AdminEvent,
  type AdminEventInput,
} from '../../features/admin/api';
import { ApiError } from '../../lib/api';
import { DISCIPLINES, disciplineLabel } from '../../lib/labels';

const eventFields = [
  { name: 'title', label: 'Título', required: true },
  {
    name: 'discipline',
    label: 'Disciplina',
    type: 'select' as const,
    required: true,
    options: DISCIPLINES.map(({ value, label }) => ({ value, label })),
  },
  { name: 'synopsis', label: 'Sinopsis', type: 'textarea' as const, required: true },
  { name: 'durationMinutes', label: 'Duración (minutos)', type: 'number' as const, min: 1, step: 1, required: true },
  { name: 'ageRating', label: 'Clasificación de edad', required: true },
  { name: 'imageUrl', label: 'URL de imagen', type: 'url' as const },
  { name: 'artistIds', label: 'Artistas y compañías', type: 'multiselect' as const },
];

function toFormValues(event?: AdminEvent): EntityFormValues {
  return {
    title: event?.title ?? '',
    discipline: event?.discipline ?? '',
    synopsis: event?.synopsis ?? '',
    durationMinutes: event ? String(event.durationMinutes) : '',
    ageRating: event?.ageRating ?? 'Todo público',
    imageUrl: event?.imageUrl ?? '',
    artistIds: event?.artists.map((artist) => String(artist.id)).join(',') ?? '',
  };
}

function toEventInput(values: EntityFormValues): AdminEventInput {
  return {
    title: values.title,
    discipline: values.discipline,
    synopsis: values.synopsis,
    durationMinutes: Number(values.durationMinutes),
    ageRating: values.ageRating,
    imageUrl: values.imageUrl?.trim() || null,
    artistIds: values.artistIds ? values.artistIds.split(',').map(Number) : [],
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

export function AdminEventsPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [artists, setArtists] = useState<AdminArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminEvent | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [eventItems, artistItems] = await Promise.all([getAdminEvents(), getAdminArtists()]);
      setEvents(eventItems);
      setArtists(artistItems);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No pudimos cargar las obras y artistas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function startCreate() {
    setEditingEvent(null);
    setFormErrors({});
    setFormError('');
    setSuccessMessage('');
    setShowForm(true);
  }

  function startEdit(event: AdminEvent) {
    setEditingEvent(event);
    setFormErrors({});
    setFormError('');
    setSuccessMessage('');
    setShowForm(true);
  }

  async function saveEvent(values: EntityFormValues) {
    setSaving(true);
    setFormErrors({});
    setFormError('');
    try {
      const input = toEventInput(values);
      if (editingEvent) {
        await updateAdminEvent(editingEvent.id, input);
        setSuccessMessage('Obra actualizada correctamente.');
      } else {
        await createAdminEvent(input);
        setSuccessMessage('Obra creada correctamente.');
      }
      setShowForm(false);
      setEditingEvent(null);
      await loadData();
      headingRef.current?.focus();
    } catch (error) {
      setFormErrors(getFieldErrors(error));
      setFormError(error instanceof Error ? error.message : 'No pudimos guardar la obra.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAdminEvent(deleteTarget.id);
      setEvents((current) => current.filter((event) => event.id !== deleteTarget.id));
      setSuccessMessage('Obra eliminada correctamente.');
      setDeleteTarget(null);
      headingRef.current?.focus();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'No pudimos eliminar la obra.');
    } finally {
      setDeleting(false);
    }
  }

  const columns: DataTableColumn<AdminEvent>[] = [
    { key: 'title', header: 'Obra', render: (event) => <span className="font-bold">{event.title}</span> },
    { key: 'discipline', header: 'Disciplina', render: (event) => disciplineLabel(event.discipline) },
    { key: 'duration', header: 'Duración', render: (event) => `${event.durationMinutes} min` },
    { key: 'artists', header: 'Artistas', render: (event) => event.artists.length ? event.artists.map((artist) => artist.name).join(', ') : 'Por confirmar' },
  ];

  const formFields = eventFields.map((field) => field.name === 'artistIds'
    ? { ...field, options: artists.map((artist) => ({ value: String(artist.id), label: artist.name })) }
    : field);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="admin-events-title">
      <p className="mb-4"><Link to="/admin">Administración</Link></p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-bold uppercase tracking-wide text-muted">Administración</p>
          <h1 ref={headingRef} id="admin-events-title" tabIndex={-1} className="mt-2 text-5xl font-black sm:text-6xl">Obras</h1>
        </div>
        {!showForm && <button type="button" onClick={startCreate} className="rounded bg-marigold px-5 py-2.5 font-bold text-ink">Agregar obra</button>}
      </div>

      {successMessage && <p className="mt-6 border-l-4 border-teal bg-white px-5 py-4 font-bold" role="status">{successMessage}</p>}
      {loading && <div className="mt-8"><Spinner label="Cargando obras…" /></div>}
      {!loading && loadError && <div className="mt-8"><ErrorMessage message={loadError} onRetry={() => void loadData()} /></div>}

      {showForm && (
        <div className="mt-8 border-l-4 border-marigold bg-white p-5 sm:p-8">
          <h2 className="mb-6 text-4xl font-bold">{editingEvent ? 'Editar obra' : 'Nueva obra'}</h2>
          {formError && <p className="mb-5 border-l-4 border-theater px-4 py-3 font-bold" role="alert">{formError}</p>}
          <EntityForm
            key={editingEvent?.id ?? 'new-event'}
            fields={formFields}
            initialValues={toFormValues(editingEvent ?? undefined)}
            errors={formErrors}
            busy={saving}
            submitLabel={editingEvent ? 'Guardar cambios' : 'Crear obra'}
            onSubmit={saveEvent}
            onCancel={() => {
              setShowForm(false);
              setEditingEvent(null);
              setFormError('');
              headingRef.current?.focus();
            }}
          />
        </div>
      )}

      {!loading && !loadError && (
        <div className="mt-8">
          <DataTable
            ariaLabel="Obras administradas"
            rows={events}
            getRowKey={(event) => event.id}
            columns={columns}
            emptyMessage="Todavía no hay obras registradas."
            renderActions={(event) => (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => startEdit(event)} className="rounded border border-ink px-3 py-1.5 font-bold">Editar</button>
                <button type="button" onClick={() => { setDeleteTarget(event); setDeleteError(''); }} className="rounded border border-theater px-3 py-1.5 font-bold text-theater">Eliminar</button>
              </div>
            )}
          />
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="¿Eliminar obra?"
          description={`Se eliminará ${deleteTarget.title}. La API impedirá eliminarla si tiene funciones asociadas.`}
          confirmLabel="Sí, eliminar obra"
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
