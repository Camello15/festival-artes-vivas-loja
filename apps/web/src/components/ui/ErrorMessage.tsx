interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ title = 'No se pudo cargar la información', message, onRetry }: ErrorMessageProps) {
  return (
    <div role="alert" className="border-l-4 border-theater bg-white px-5 py-4">
      <p className="font-bold">{title}</p>
      <p className="text-muted">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded border border-ink px-3 py-1.5 text-sm font-bold"
        >
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}
