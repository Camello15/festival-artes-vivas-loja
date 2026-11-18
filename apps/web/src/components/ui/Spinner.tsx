export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <p role="status" className="flex items-center gap-3 text-muted">
      <span
        aria-hidden="true"
        className="inline-block size-5 animate-spin rounded-full border-2 border-line border-t-ink"
      />
      {label}
    </p>
  );
}
