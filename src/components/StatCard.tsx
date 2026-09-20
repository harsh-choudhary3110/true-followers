import { Info, type LucideIcon } from 'lucide-react';
import Tooltip from './Tooltip';

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
  /** Optional explanatory note shown via an ⓘ tooltip next to the label. */
  note?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'text-fuchsia-600',
  note,
}: Props) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          {note && (
            <Tooltip content={note} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <Info className="h-3.5 w-3.5" />
            </Tooltip>
          )}
        </div>
        <Icon className={`h-5 w-5 ${accent}`} />
      </div>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
