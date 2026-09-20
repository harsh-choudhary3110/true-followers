import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Extra classes for the scroll row (gaps, borders, etc.). */
  className?: string;
  /** Tailwind `from-*` color(s) for the edge fade — should match the surface
   *  behind the tabs (e.g. "from-white dark:from-slate-900"). */
  fadeClassName?: string;
}

/**
 * Horizontally scrollable tab row with a hidden scrollbar. When the content
 * overflows, left/right arrow buttons appear to scroll it. Styling-agnostic —
 * pass your own tab buttons as children.
 */
export default function ScrollableTabs({
  children,
  className = '',
  fadeClassName = 'from-white dark:from-slate-900',
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setCanLeft(el.scrollLeft > 1);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [children]);

  const scroll = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.7, behavior: 'smooth' });
  };

  const arrowCls =
    'absolute top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white';

  return (
    <div className="relative">
      {canLeft && (
        <>
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 z-[1] w-14 bg-gradient-to-r to-transparent ${fadeClassName}`}
          />
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className={`${arrowCls} left-0`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </>
      )}

      <div ref={ref} className={`no-scrollbar flex overflow-x-auto scroll-smooth ${className}`}>
        {children}
      </div>

      {canRight && (
        <>
          <div
            className={`pointer-events-none absolute inset-y-0 right-0 z-[1] w-14 bg-gradient-to-l to-transparent ${fadeClassName}`}
          />
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className={`${arrowCls} right-0`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
