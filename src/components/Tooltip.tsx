import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable tooltip: opens on hover/focus (desktop) and toggles on tap/click
 * (mobile). The bubble is portalled to <body> with fixed positioning, so it's
 * never clipped by a parent's overflow.
 */
export default function Tooltip({ content, children, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  // `centerX` is the trigger's centre; triggerTop/Bottom drive the vertical flip.
  const [pos, setPos] = useState<{
    triggerTop: number;
    triggerBottom: number;
    centerX: number;
  } | null>(null);
  // Final, clamped bubble position (px, viewport-relative).
  const [left, setLeft] = useState(0);
  const [top, setTop] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    function update() {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({
        triggerTop: r.top,
        triggerBottom: r.bottom,
        centerX: r.left + r.width / 2,
      });
    }
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  // Clamp the bubble inside the viewport on both axes, and flip it above the
  // trigger when there isn't room below. Runs before paint, so there's no jump.
  useLayoutEffect(() => {
    if (!open || !pos) return;
    const tip = tipRef.current;
    if (!tip) return;
    const tipW = tip.offsetWidth;
    const tipH = tip.offsetHeight;
    const pad = 8;
    const gap = 8;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    setLeft(Math.max(pad, Math.min(pos.centerX - tipW / 2, vw - tipW - pad)));
    // Prefer below; flip above only if below overflows and above has room.
    const below = pos.triggerBottom + gap;
    const flipUp =
      below + tipH + pad > vh && pos.triggerTop - gap - tipH - pad >= 0;
    setTop(flipUp ? pos.triggerTop - tipH - gap : below);
  }, [open, pos]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
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
    <span
      ref={ref}
      className={`inline-flex cursor-help ${className}`}
      tabIndex={0}
      role="button"
      aria-label="More information"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setOpen((o) => !o);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setOpen((o) => !o);
        }
      }}
    >
      {children}
      {open &&
        pos &&
        createPortal(
          <span
            ref={tipRef}
            role="tooltip"
            className="pointer-events-none fixed z-[60] w-max max-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal leading-snug text-slate-600 shadow-lg dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
            style={{ top, left }}
          >
            {content}
          </span>,
          document.body,
        )}
    </span>
  );
}
