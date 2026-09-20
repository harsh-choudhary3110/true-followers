import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Info } from 'lucide-react';
import Tooltip from './Tooltip';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  /** Optional explanatory note shown via an ⓘ button (hover on desktop, tap on mobile). */
  note?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  ariaLabel?: string;
}

export default function Select({ value, onChange, options, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const current = options.find((o) => o.value === value) ?? options[0];

  // Position the portalled menu under the trigger.
  useLayoutEffect(() => {
    if (!open) return;
    function update() {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left, width: r.width });
    }
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  // Close on outside click or Escape (menu is portalled, so check both refs).
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/40 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/20"
      >
        {current?.label}
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            className="animate-pop fixed z-50 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900"
            style={{ top: pos.top, left: pos.left, minWidth: pos.width }}
          >
            {options.map((o) => {
              const selected = o.value === value;
              // Disabled options render as a div (with an optional info tooltip)
              // so we never nest a button inside a button.
              if (o.disabled) {
                return (
                  <div
                    key={o.value}
                    role="option"
                    aria-selected={false}
                    aria-disabled
                    className="flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-400 dark:text-slate-600"
                  >
                    <span>{o.label}</span>
                    {o.note && (
                      <Tooltip content={o.note} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <Info className="h-4 w-4 shrink-0" />
                      </Tooltip>
                    )}
                  </div>
                );
              }
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition ${
                    selected
                      ? 'bg-fuchsia-50 font-semibold text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5'
                  }`}
                >
                  {o.label}
                  {selected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
