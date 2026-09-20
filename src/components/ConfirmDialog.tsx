import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm button as destructive (red). Defaults to true. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    // Focus the confirm button and close on Escape.
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKey);
    // Prevent background scroll while the dialog is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 animate-fade bg-slate-900/50 backdrop-blur-sm" onClick={onCancel} />

      <div className="animate-pop relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl dark:border-white/10 dark:bg-[#14161f] sm:p-8">
        <div className="flex items-start gap-4">
          {destructive && (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-7 flex gap-3">
          <button
            type="button"
            className="btn-secondary flex-1 justify-center py-3"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={
              destructive
                ? 'btn flex-1 justify-center py-3 bg-rose-600 text-white shadow-lg shadow-rose-500/25 hover:-translate-y-0.5 hover:bg-rose-700'
                : 'btn-primary flex-1 justify-center py-3'
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
