import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Spinner } from '../../components/ui/Spinner';
import { ConfirmDialog } from '../../features/admin/components/ConfirmDialog';
import { DataTable, type DataTableColumn } from '../../features/admin/components/DataTable';
import { EntityForm, type EntityFormValues } from '../../features/admin/components/EntityForm';
import {
  createAdminArtist,
  deleteAdminArtist,
  getAdminArtists,
  updateAdminArtist,
  type AdminArtist,
  type AdminArtistInput,
} from '../../features/admin/api';
import { ApiError } from '../../lib/api';
import { artistKindLabel } from '../../lib/labels';

const artistFields = [
  { name: 'name', label: 'Nombre', required: true },
  {
    name: 'kind',
    label: 'Tipo',
    type: 'select' as const,
    required: true,
    options: [
      { value: 'SOLO', label: 'Solista' },
      { value: 'COMPANY', label: 'Compañía' },
    ],
  },
  { name: 'country', label: 'País', required: true },
  { name: 'bio', label: 'Biografía', type: 'textarea' as const },
  { name: 'imageUrl', label: 'URL de imagen', type: 'url' as const },
  { name: 'website', label: 'Sitio web', type: 'url' as const },
];

function toFormValues(artist?: AdminArtist): EntityFormValues {
  return {
    name: artist?.name ?? '',
    kind: artist?.kind ?? '',
    country: artist?.country ?? '',
    bio: artist?.bio ?? '',
    imageUrl: artist?.imageUrl ?? '',
    website: artist?.website ?? '',
  };
}

function toArtistInput(values: EntityFormValues): AdminArtistInput {
  return {
    name: values.name,
    kind: values.kind as AdminArtistInput['kind'],
    country: values.country,
    bio: values.bio ?? '',
    imageUrl: values.imageUrl?.trim() || null,
    website: values.website?.trim() || null,
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

export function AdminArtistsPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [artists, setArtists] = useState<AdminArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingArtist, setEditingArtist] = useState<AdminArtist | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminArtist | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadArtists = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setArtists(await getAdminArtists());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No pudimos cargar los artistas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadArtists();
  }, [loadArtists]);

  function startCreate() {
    setEditingArtist(null);
    setFormErrors({});
    setFormError('');
    setSuccessMessage('');
    setShowForm(true);
  }

  function startEdit(artist: AdminArtist) {
    setEditingArtist(artist);
    setFormErrors({});
    setFormError('');
    setSuccessMessage('');
    setShowForm(true);
  }

  async function saveArtist(values: EntityFormValues) {
    setSaving(true);
    setFormErrors({});
    setFormError('');
    try {
      const input = toArtistInput(values);
      if (editingArtist) {
        await updateAdminArtist(editingArtist.id, input);
        setSuccessMessage('Artista actualizado correctamente.');
      } else {
        await createAdminArtist(input);
        setSuccessMessage('Artista creado correctamente.');
      }
      setShowForm(false);
      setEditingArtist(null);
      await loadArtists();
      headingRef.current?.focus();
    } catch (error) {
      setFormErrors(getFieldErrors(error));
      setFormError(error instanceof Error ? error.message : 'No pudimos guardar el artista.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAdminArtist(deleteTarget.id);
      setArtists((current) => current.filter((artist) => artist.id !== deleteTarget.id));
      setSuccessMessage('Artista eliminado correctamente.');
      setDeleteTarget(null);
      headingRef.current?.focus();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'No pudimos eliminar el artista.');
    } finally {
      setDeleting(false);
    }
  }

  const columns: DataTableColumn<AdminArtist>[] = [
    { key: 'name', header: 'Artista o compañía', render: (artist) => <span className="font-bold">{artist.name}</span> },
    { key: 'kind', header: 'Tipo', render: (artist) => artistKindLabel(artist.kind) },
    { key: 'country', header: 'País', render: (artist) => artist.country },
    { key: 'website', header: 'Sitio web', render: (artist) => artist.website ? <a href={artist.website} target="_blank" rel="noopener noreferrer">Abrir sitio ↗</a> : '—' },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="admin-artists-title">
      <p className="mb-4"><Link to="/admin">Administración</Link></p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-bold uppercase tracking-wide text-muted">Administración</p>
          <h1 ref={headingRef} id="admin-artists-title" tabIndex={-1} className="mt-2 text-5xl font-black sm:text-6xl">Artistas</h1>
        </div>
        {!showForm && <button type="button" onClick={startCreate} className="rounded bg-marigold px-5 py-2.5 font-bold text-ink">Agregar artista</button>}
      </div>

      {successMessage && <p className="mt-6 border-l-4 border-teal bg-white px-5 py-4 font-bold" role="status">{successMessage}</p>}
      {loading && <div className="mt-8"><Spinner label="Cargando artistas…" /></div>}
      {!loading && loadError && <div className="mt-8"><ErrorMessage message={loadError} onRetry={() => void loadArtists()} /></div>}

      {showForm && (
        <div className="mt-8 border-l-4 border-marigold bg-white p-5 sm:p-8">
          <h2 className="mb-6 text-4xl font-bold">{editingArtist ? 'Editar artista' : 'Nuevo artista'}</h2>
          {formError && <p className="mb-5 border-l-4 border-theater px-4 py-3 font-bold" role="alert">{formError}</p>}
          <EntityForm
            key={editingArtist?.id ?? 'new-artist'}
            fields={artistFields}
            initialValues={toFormValues(editingArtist ?? undefined)}
            errors={formErrors}
            busy={saving}
            submitLabel={editingArtist ? 'Guardar cambios' : 'Crear artista'}
            onSubmit={saveArtist}
            onCancel={() => {
              setShowForm(false);
              setEditingArtist(null);
              setFormError('');
              headingRef.current?.focus();
            }}
          />
        </div>
      )}

      {!loading && !loadError && (
        <div className="mt-8">
          <DataTable
            ariaLabel="Artistas administrados"
            rows={artists}
            getRowKey={(artist) => artist.id}
            columns={columns}
            emptyMessage="Todavía no hay artistas registrados."
            renderActions={(artist) => (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => startEdit(artist)} className="rounded border border-ink px-3 py-1.5 font-bold">Editar</button>
                <button type="button" onClick={() => { setDeleteTarget(artist); setDeleteError(''); }} className="rounded border border-theater px-3 py-1.5 font-bold text-theater">Eliminar</button>
              </div>
            )}
          />
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="¿Eliminar artista?"
          description={`Se eliminará ${deleteTarget.name}. Si tiene obras asociadas, la API rechazará la eliminación.`}
          confirmLabel="Sí, eliminar artista"
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
