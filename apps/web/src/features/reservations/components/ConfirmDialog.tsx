import { useEffect, useRef, type KeyboardEvent, type RefObject, type SyntheticEvent } from 'react';

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const fallbackFocusElement = fallbackFocusRef?.current;
    if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
    else dialog?.setAttribute('open', '');
    cancelButtonRef.current?.focus();
    return () => {
      if (dialog?.open && typeof dialog.close === 'function') dialog.close();
      if (previousFocus?.isConnected) previousFocus.focus();
      else fallbackFocusElement?.focus();
    };
  }, [fallbackFocusRef]);

  useEffect(() => {
    if (busy) dialogRef.current?.focus();
  }, [busy]);

  function keepFocusInside(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'Escape' && !busy) {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== 'Tab') return;

    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable?.item(0);
    const last = focusable?.item((focusable.length ?? 0) - 1);
    if (!first || !last) {
      event.preventDefault();
      dialog?.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function preventNativeClose(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    if (!busy) onCancel();
  }

  return (
      <dialog
        ref={dialogRef}
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        tabIndex={-1}
        onKeyDown={keepFocusInside}
        onCancel={preventNativeClose}
        className="fixed inset-0 z-50 m-auto w-[calc(100vw-2rem)] max-w-lg border-t-4 border-marigold bg-paper p-6 text-ink shadow-xl sm:p-8"
      >
        <h2 id="confirm-dialog-title" className="text-4xl font-black">{title}</h2>
        <p id="confirm-dialog-description" className="mt-4">{description}</p>
        {error && <p role="alert" className="mt-4 font-bold text-theater">{error}</p>}
        <p className="sr-only" role="status" aria-live="polite">{busy ? 'Procesando la solicitud…' : ''}</p>
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
  );
}
