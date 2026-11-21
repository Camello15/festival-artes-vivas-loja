import { useEffect, useRef, type KeyboardEvent, type RefObject } from 'react';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
  error?: string;
  fallbackFocusRef?: RefObject<HTMLElement | null>;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  busy = false,
  error,
  fallbackFocusRef,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const fallbackFocusElement = fallbackFocusRef?.current;
    cancelButtonRef.current?.focus();
    return () => {
      if (previousFocus?.isConnected) previousFocus.focus();
      else fallbackFocusElement?.focus();
    };
  }, [fallbackFocusRef]);

  function keepFocusInside(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'Escape' && !busy) {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== 'Tab') return;

    if (event.shiftKey && document.activeElement === cancelButtonRef.current) {
      event.preventDefault();
      confirmButtonRef.current?.focus();
    } else if (!event.shiftKey && document.activeElement === confirmButtonRef.current) {
      event.preventDefault();
      cancelButtonRef.current?.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
    >
      <dialog
        open
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        tabIndex={-1}
        onKeyDown={keepFocusInside}
        className="w-full max-w-lg border-t-4 border-marigold bg-paper p-6 shadow-xl sm:p-8"
      >
        <h2 id="confirm-dialog-title" className="text-4xl font-black">{title}</h2>
        <p id="confirm-dialog-description" className="mt-4">{description}</p>
        {error && <p role="alert" className="mt-4 font-bold text-theater">{error}</p>}
        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded border border-ink px-4 py-2 font-bold text-ink disabled:opacity-60"
          >
            Volver
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded bg-marigold px-4 py-2 font-bold text-ink disabled:opacity-60"
          >
            {busy ? 'Cancelando…' : confirmLabel}
          </button>
        </div>
      </dialog>
    </div>
  );
}
