import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Spinner } from '../../components/ui/Spinner';
import { ConfirmDialog } from '../../features/admin/components/ConfirmDialog';
import { DataTable, type DataTableColumn } from '../../features/admin/components/DataTable';
import { EntityForm, type EntityFormValues } from '../../features/admin/components/EntityForm';
import {
  createAdminVenue,
  deleteAdminVenue,
  getAdminVenues,
  updateAdminVenue,
  type AdminVenue,
  type AdminVenueInput,
} from '../../features/admin/api';
import { ApiError } from '../../lib/api';

const venueFields = [
  { name: 'name', label: 'Nombre', required: true },
  { name: 'address', label: 'Dirección', required: true },
  { name: 'latitude', label: 'Latitud', type: 'number' as const, min: -90, max: 90, step: 0.000001, required: true },
  { name: 'longitude', label: 'Longitud', type: 'number' as const, min: -180, max: 180, step: 0.000001, required: true },
  { name: 'capacity', label: 'Aforo', type: 'number' as const, min: 1, step: 1, required: true },
  { name: 'description', label: 'Descripción', type: 'textarea' as const },
  { name: 'imageUrl', label: 'URL de imagen', type: 'url' as const },
];

function toFormValues(venue?: AdminVenue): EntityFormValues {
  return {
    name: venue?.name ?? '',
    address: venue?.address ?? '',
    latitude: venue ? String(venue.latitude) : '',
    longitude: venue ? String(venue.longitude) : '',
    capacity: venue ? String(venue.capacity) : '',
    description: venue?.description ?? '',
    imageUrl: venue?.imageUrl ?? '',
  };
}

function toVenueInput(values: EntityFormValues): AdminVenueInput {
  return {
    name: values.name,
    address: values.address,
    latitude: Number(values.latitude),
    longitude: Number(values.longitude),
    capacity: Number(values.capacity),
    description: values.description ?? '',
    imageUrl: values.imageUrl?.trim() || null,
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

export function AdminVenuesPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [venues, setVenues] = useState<AdminVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingVenue, setEditingVenue] = useState<AdminVenue | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminVenue | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadVenues = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setVenues(await getAdminVenues());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No pudimos cargar los escenarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVenues();
  }, [loadVenues]);

  function startCreate() {
    setEditingVenue(null);
    setFormErrors({});
    setFormError('');
    setSuccessMessage('');
    setShowForm(true);
  }

  function startEdit(venue: AdminVenue) {
    setEditingVenue(venue);
    setFormErrors({});
    setFormError('');
    setSuccessMessage('');
    setShowForm(true);
  }

  async function saveVenue(values: EntityFormValues) {
    setSaving(true);
    setFormErrors({});
    setFormError('');
    try {
      const input = toVenueInput(values);
      if (editingVenue) {
        await updateAdminVenue(editingVenue.id, input);
        setSuccessMessage('Escenario actualizado correctamente.');
      } else {
        await createAdminVenue(input);
        setSuccessMessage('Escenario creado correctamente.');
      }
      setShowForm(false);
      setEditingVenue(null);
      await loadVenues();
      headingRef.current?.focus();
    } catch (error) {
      setFormErrors(getFieldErrors(error));
      setFormError(error instanceof Error ? error.message : 'No pudimos guardar el escenario.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAdminVenue(deleteTarget.id);
      setVenues((current) => current.filter((venue) => venue.id !== deleteTarget.id));
      setSuccessMessage('Escenario eliminado correctamente.');
      setDeleteTarget(null);
      headingRef.current?.focus();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'No pudimos eliminar el escenario.');
    } finally {
      setDeleting(false);
    }
  }

  const columns: DataTableColumn<AdminVenue>[] = [
    { key: 'name', header: 'Escenario', render: (venue) => <span className="font-bold">{venue.name}</span> },
    { key: 'address', header: 'Dirección', render: (venue) => venue.address },
    { key: 'capacity', header: 'Aforo', render: (venue) => venue.capacity },
    { key: 'location', header: 'Coordenadas', render: (venue) => `${venue.latitude}, ${venue.longitude}` },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="admin-venues-title">
      <p className="mb-4"><Link to="/admin">Administración</Link></p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-bold uppercase tracking-wide text-muted">Administración</p>
          <h1 ref={headingRef} id="admin-venues-title" tabIndex={-1} className="mt-2 text-5xl font-black sm:text-6xl">Escenarios</h1>
        </div>
        {!showForm && <button type="button" onClick={startCreate} className="rounded bg-marigold px-5 py-2.5 font-bold text-ink">Agregar escenario</button>}
      </div>

      {successMessage && <p className="mt-6 border-l-4 border-teal bg-white px-5 py-4 font-bold" role="status">{successMessage}</p>}
      {loading && <div className="mt-8"><Spinner label="Cargando escenarios…" /></div>}
      {!loading && loadError && <div className="mt-8"><ErrorMessage message={loadError} onRetry={() => void loadVenues()} /></div>}

      {showForm && (
        <div className="mt-8 border-l-4 border-marigold bg-white p-5 sm:p-8">
          <h2 className="mb-6 text-4xl font-bold">{editingVenue ? 'Editar escenario' : 'Nuevo escenario'}</h2>
          {formError && <p className="mb-5 border-l-4 border-theater px-4 py-3 font-bold" role="alert">{formError}</p>}
          <EntityForm
            key={editingVenue?.id ?? 'new-venue'}
            fields={venueFields}
            initialValues={toFormValues(editingVenue ?? undefined)}
            errors={formErrors}
            busy={saving}
            submitLabel={editingVenue ? 'Guardar cambios' : 'Crear escenario'}
            onSubmit={saveVenue}
            onCancel={() => {
              setShowForm(false);
              setEditingVenue(null);
              setFormError('');
              headingRef.current?.focus();
            }}
          />
        </div>
      )}

      {!loading && !loadError && (
        <div className="mt-8">
          <DataTable
            ariaLabel="Escenarios administrados"
            rows={venues}
            getRowKey={(venue) => venue.id}
            columns={columns}
            emptyMessage="Todavía no hay escenarios registrados."
            renderActions={(venue) => (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => startEdit(venue)} className="rounded border border-ink px-3 py-1.5 font-bold">Editar</button>
                <button type="button" onClick={() => { setDeleteTarget(venue); setDeleteError(''); }} className="rounded border border-theater px-3 py-1.5 font-bold text-theater">Eliminar</button>
              </div>
            )}
          />
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="¿Eliminar escenario?"
          description={`Se eliminará ${deleteTarget.name}. La acción no se puede deshacer.`}
          confirmLabel="Sí, eliminar escenario"
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
