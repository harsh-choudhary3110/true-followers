import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';
import { ArrowDownAZ, ArrowUpAZ, Download, Search } from 'lucide-react';
import type { Account } from '../lib/types';
import { filterAndSort, type SortDir, type SortKey } from '../lib/diff';
import { downloadCsv } from '../lib/csv';
import UserRow from './UserRow';
import Select from './Select';

const ROW = 61;

/** Virtualized against the page/window scroll (default, full-page lists). */
function WindowVirtualList({ rows, dateLabel }: { rows: Account[]; dateLabel?: string }) {
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const compute = () => setScrollMargin(el.getBoundingClientRect().top + window.scrollY);
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [rows.length]);

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => ROW,
    overscan: 10,
    scrollMargin,
  });

  return (
    <div ref={listRef}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const account = rows[vi.index];
          return (
            <div
              key={account.username}
              ref={virtualizer.measureElement}
              data-index={vi.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vi.start - scrollMargin}px)`,
              }}
            >
              <UserRow account={account} dateLabel={dateLabel} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Virtualized against a local scroll container (inside a modal). */
function ScrollVirtualList({ rows, dateLabel }: { rows: Account[]; dateLabel?: string }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW,
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="max-h-[60vh] overflow-y-auto">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const account = rows[vi.index];
          return (
            <div
              key={account.username}
              ref={virtualizer.measureElement}
              data-index={vi.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vi.start}px)`,
              }}
            >
              <UserRow account={account} dateLabel={dateLabel} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  accounts: Account[];
  emptyLabel: string;
  csvName: string;
  dateLabel?: string;
  /** Window-scroll virtualization (default). Set false inside a modal, where a
   *  local scroll container is used instead. */
  virtualize?: boolean;
}

export default function UserList({
  accounts,
  emptyLabel,
  csvName,
  dateLabel,
  virtualize = true,
}: Props) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('username');
  const [dir, setDir] = useState<SortDir>('asc');

  // HTML exports have no timestamps — only offer date sort when dates exist.
  const hasDates = useMemo(() => accounts.some((a) => a.timestamp != null), [accounts]);
  const effectiveSortKey: SortKey = hasDates ? sortKey : 'username';

  const rows = useMemo(
    () => filterAndSort(accounts, query, effectiveSortKey, dir),
    [accounts, query, effectiveSortKey, dir],
  );

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            type="search"
            aria-label="Search username"
            placeholder="Search username…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <Select
            value={effectiveSortKey}
            onChange={(v) => setSortKey(v as SortKey)}
            ariaLabel="Sort by"
            options={[
              { value: 'username', label: 'Sort: Username' },
              {
                value: 'date',
                label: 'Sort: Date',
                disabled: !hasDates,
                note: !hasDates
                  ? 'This export has no follow dates (HTML). Re-export as JSON to sort by date.'
                  : undefined,
              },
            ]}
          />
          <button
            type="button"
            className="btn-secondary !px-2.5"
            onClick={() => setDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            aria-label="Toggle sort direction"
            title={dir === 'asc' ? 'Ascending' : 'Descending'}
          >
            {dir === 'asc' ? <ArrowDownAZ className="h-5 w-5" /> : <ArrowUpAZ className="h-5 w-5" />}
          </button>
          <button
            type="button"
            className="btn-secondary !px-3"
            onClick={() => downloadCsv(csvName, rows)}
            disabled={rows.length === 0}
          >
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
          {query ? 'No accounts match your search.' : emptyLabel}
        </p>
      ) : virtualize ? (
        <WindowVirtualList rows={rows} dateLabel={dateLabel} />
      ) : (
        <ScrollVirtualList rows={rows} dateLabel={dateLabel} />
      )}
    </div>
  );
}
