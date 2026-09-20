import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
}

/** Generic centered modal: portalled, backdrop + Escape to close, scroll-locked. */
export default function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6"
    >
      <div className="absolute inset-0 animate-fade bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="animate-pop relative my-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#14161f]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-white/10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn-ghost !px-2 text-slate-500 dark:text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
