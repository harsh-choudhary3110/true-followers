import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BookmarkPlus,
  Check,
  Heart,
  RefreshCw,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store';
import StatCard from '../components/StatCard';
import UserList from '../components/UserList';
import ScrollableTabs from '../components/ScrollableTabs';
import Seo from '../components/Seo';
import { saveSnapshot } from '../lib/snapshot';
import type { Account } from '../lib/types';

type TabKey = 'notFollowingBack' | 'notFollowedBack' | 'mutuals' | 'followers' | 'following';

export default function Results() {
  const navigate = useNavigate();
  const data = useStore((s) => s.data);
  const comparison = useStore((s) => s.comparison);
  const [tab, setTab] = useState<TabKey>('notFollowingBack');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data || !comparison) navigate('/upload');
  }, [data, comparison, navigate]);

  // During static prerender (and while redirecting to /upload) there's no data,
  // but we still emit the noindex tag so the built results.html is never indexed.
  if (!data || !comparison)
    return (
      <Seo
        title="Your results — True Followers"
        description="Your Instagram follower comparison results."
        path="/results"
        noindex
      />
    );

  const { counts } = comparison;

  const tabs: {
    key: TabKey;
    label: string;
    accounts: Account[];
    empty: string;
    csv: string;
    dateLabel: string;
  }[] = [
    {
      key: 'notFollowingBack',
      label: `Don't follow you back (${counts.notFollowingBack})`,
      accounts: comparison.notFollowingBack,
      empty: 'Everyone you follow follows you back. Nice.',
      csv: 'not-following-you-back.csv',
      dateLabel: 'Following since', // you follow them since…
    },
    {
      key: 'notFollowedBack',
      label: `You don't follow back (${counts.notFollowedBack})`,
      accounts: comparison.notFollowedBack,
      empty: 'You follow back everyone who follows you.',
      csv: 'you-dont-follow-back.csv',
      dateLabel: 'Follows you since', // they followed you on…
    },
    {
      key: 'mutuals',
      label: `Mutuals (${counts.mutuals})`,
      accounts: comparison.mutuals,
      empty: 'No mutual follows found.',
      csv: 'mutuals.csv',
      dateLabel: 'Following since', // you follow them since…
    },
    {
      key: 'followers',
      label: `Followers (${counts.followers})`,
      accounts: data.followers,
      empty: 'No followers found in your export.',
      csv: 'followers.csv',
      dateLabel: 'Follows you since', // they followed you on…
    },
    {
      key: 'following',
      label: `Following (${counts.following})`,
      accounts: data.following,
      empty: 'No following found in your export.',
      csv: 'following.csv',
      dateLabel: 'Following since', // you follow them since…
    },
  ];

  const active = tabs.find((t) => t.key === tab)!;

  async function handleSave() {
    if (!data) return;
    const { saved: didSave } = await saveSnapshot(data);
    if (didSave) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success('Snapshot saved');
    } else {
      toast('Snapshot already up to date', { icon: '✅' });
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Seo title="Your results — True Followers" description="Your Instagram follower comparison results." path="/results" noindex />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Your results
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Based on the export you just uploaded.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary flex-1 justify-center sm:flex-none"
            onClick={handleSave}
          >
            {saved ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" /> Saved
              </>
            ) : (
              <>
                <BookmarkPlus className="h-4 w-4" /> Save snapshot
              </>
            )}
          </button>
          <Link to="/upload" className="btn-secondary flex-1 justify-center sm:flex-none">
            <RefreshCw className="h-4 w-4" /> New upload
          </Link>
        </div>
      </div>

      {data.warnings.length > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <ul className="list-disc space-y-1 pl-4">
            {data.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Followers" value={counts.followers.toLocaleString()} icon={Users} />
        <StatCard
          label="Following"
          value={counts.following.toLocaleString()}
          icon={UserPlus}
          note="Counts your export file. It can be higher than Instagram's app if some accounts you follow have since deactivated or been deleted — those stay in your following but drop off your followers."
        />
        <StatCard
          label="Mutuals"
          value={counts.mutuals.toLocaleString()}
          icon={Heart}
          accent="text-rose-500"
        />
        <StatCard
          label="Non-followers"
          value={counts.notFollowingBack.toLocaleString()}
          icon={UserMinus}
          accent="text-amber-500"
          note="People you follow who don't follow you back. Some may be deactivated or deleted accounts rather than deliberate non-followers."
        />
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <ScrollableTabs
          className="gap-1 border-b border-slate-200 sm:gap-2 dark:border-slate-800"
          fadeClassName="from-slate-50 dark:from-[#080a12]"
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
                tab === t.key
                  ? 'border-fuchsia-600 text-fuchsia-600 dark:border-fuchsia-400 dark:text-fuchsia-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </ScrollableTabs>

        <div className="mt-5">
          <UserList
            accounts={active.accounts}
            emptyLabel={active.empty}
            csvName={active.csv}
            dateLabel={active.dateLabel}
          />
        </div>
      </div>
    </div>
  );
}
