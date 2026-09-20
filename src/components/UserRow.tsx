import { ExternalLink } from 'lucide-react';
import type { Account } from '../lib/types';
import Avatar from './Avatar';

function formatDate(timestamp: number | null): string | null {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function UserRow({
  account,
  dateLabel = 'Since',
}: {
  account: Account;
  dateLabel?: string;
}) {
  const date = formatDate(account.timestamp);
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-slate-800/50">
      <Avatar username={account.username} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900 dark:text-white">
          @{account.displayName}
        </p>
        {date && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {dateLabel} {date}
          </p>
        )}
      </div>
      <a
        href={account.href}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary !px-3 !py-1.5 text-xs"
      >
        Profile <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
