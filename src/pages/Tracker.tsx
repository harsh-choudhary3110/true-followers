import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FolderOpen, Save, Trash2, UserMinus, UserPlus, type LucideIcon } from "lucide-react";
import {
  clearSnapshots,
  deleteSnapshot,
  exportSnapshotsJson,
  importSnapshotsJson,
  loadSnapshots,
} from "../lib/snapshot";
import { compareFollows, type FollowDiff } from "../lib/diff";
import UserList from "../components/UserList";
import Seo from "../components/Seo";
import TrendChart, { type TrendPoint } from "../components/TrendChart";
import ConfirmDialog from "../components/ConfirmDialog";
import Modal from "../components/Modal";
import ScrollableTabs from "../components/ScrollableTabs";
import type { Snapshot } from "../lib/types";

interface ConfirmState {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const CHANGE_META: { key: keyof FollowDiff; sign: string; label: string; cls: string }[] = [
  { key: "lostFollowers", sign: "−", label: "lost followers", cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" },
  { key: "newFollowers", sign: "+", label: "new followers", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
  { key: "unfollowedByYou", sign: "−", label: "you unfollowed", cls: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300" },
  { key: "followedByYou", sign: "+", label: "you followed", cls: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" },
];

const MODAL_TABS: {
  key: keyof FollowDiff;
  label: string;
  Icon: LucideIcon;
  activeCls: string;
  empty: string;
  csv: string;
  dateLabel: string;
}[] = [
  {
    key: "lostFollowers",
    label: "Lost followers",
    Icon: UserMinus,
    activeCls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    empty: "No one unfollowed you since this snapshot. 🎉",
    csv: "unfollowed-you.csv",
    dateLabel: "Followed you since",
  },
  {
    key: "newFollowers",
    label: "New followers",
    Icon: UserPlus,
    activeCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    empty: "No new followers since this snapshot.",
    csv: "new-followers.csv",
    dateLabel: "Followed you since",
  },
  {
    key: "unfollowedByYou",
    label: "You unfollowed",
    Icon: UserMinus,
    activeCls: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    empty: "You didn't unfollow anyone since this snapshot.",
    csv: "you-unfollowed.csv",
    dateLabel: "Following since",
  },
  {
    key: "followedByYou",
    label: "You followed",
    Icon: UserPlus,
    activeCls: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    empty: "You didn't follow anyone new since this snapshot.",
    csv: "you-followed.csv",
    dateLabel: "Following since",
  },
];

/** At-a-glance change chips for a snapshot (non-zero metrics only). */
function SnapshotChanges({ diff }: { diff: FollowDiff }) {
  const items = CHANGE_META.map((m) => ({ ...m, n: diff[m.key].length })).filter((x) => x.n > 0);
  if (items.length === 0) {
    return <span className="text-xs text-slate-400 dark:text-slate-500">No changes</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((x) => (
        <span
          key={x.key}
          className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${x.cls}`}
        >
          {x.sign}
          {x.n} {x.label}
        </span>
      ))}
    </div>
  );
}

export default function Tracker() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<keyof FollowDiff>('lostFollowers');
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSnapshots().then(setSnapshots);
  }, []);

  // The clicked snapshot and the one just before it (older). We show what
  // changed to REACH the clicked snapshot — same as its at-a-glance chips.
  const compareIdx = snapshots.findIndex((s) => s.id === compareId);
  const compareSnap = compareIdx >= 0 ? snapshots[compareIdx] : null;
  const olderSnap = compareIdx >= 0 ? snapshots[compareIdx + 1] : undefined;

  const diff = useMemo(
    () => (compareSnap && olderSnap ? compareFollows(olderSnap, compareSnap) : null),
    [compareSnap, olderSnap],
  );

  // Snapshots are stored newest-first; the chart wants oldest-first.
  const trendPoints: TrendPoint[] = useMemo(
    () =>
      [...snapshots].reverse().map((s) => ({
        date: s.savedAt,
        followers: s.followers.length,
        following: s.following.length,
      })),
    [snapshots],
  );

  function requestDelete(s: Snapshot) {
    setConfirm({
      title: "Delete this snapshot?",
      message: `The snapshot from ${formatWhen(s.savedAt)} will be permanently deleted.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        setSnapshots(await deleteSnapshot(s.id));
        if (compareId === s.id) setCompareId(null);
      },
    });
  }

  async function handleExport() {
    const json = await exportSnapshotsJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `truefollowers-snapshots-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${snapshots.length} snapshot${snapshots.length === 1 ? '' : 's'}`);
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const { snapshots: next, added, skipped } = await importSnapshotsJson(text);
      setSnapshots(next);
      toast.success(
        `Imported ${added} snapshot${added === 1 ? "" : "s"}` +
          (skipped ? ` · ${skipped} already existed` : ""),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not import that file.");
    }
  }

  function requestClearAll() {
    setConfirm({
      title: "Clear all snapshots?",
      message: `This permanently deletes all ${snapshots.length} saved snapshot${
        snapshots.length === 1 ? "" : "s"
      }. This can't be undone.`,
      confirmLabel: "Delete all",
      onConfirm: () => {
        clearSnapshots();
        setSnapshots([]);
        setCompareId(null);
      },
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Seo
        title="Instagram unfollower tracker — True Followers"
        description="Track who unfollowed you on Instagram over time. Save snapshots privately in your browser and compare them to see lost followers, new followers, and your follow changes."
        path="/tracker"
      />
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Unfollower tracker
      </h1>
      <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
        Save a snapshot today, then upload a fresh export later to see exactly
        who unfollowed you since. Snapshots are stored only on this device.
      </p>

      {/* Shared hidden file input for importing a backup */}
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        aria-label="Import snapshots backup file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImportFile(f);
          e.target.value = "";
        }}
      />

      {snapshots.length === 0 ? (
        <div className="card mt-8 p-8 text-center">
          <p className="text-slate-600 dark:text-slate-300">
            You don't have any saved snapshots yet.
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Upload an export and click <strong>Save snapshot</strong> on the
            results page to start tracking — or import a backup you exported
            earlier.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/upload" className="btn-primary">
              Upload an export
            </Link>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => fileRef.current?.click()}
            >
              <FolderOpen className="h-4 w-4" /> Import backup
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Growth over time */}
          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Growth over time
            </h2>
            {trendPoints.length >= 2 ? (
              <div className="mt-3">
                <TrendChart points={trendPoints} />
              </div>
            ) : (
              <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white/50 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
                Save at least two snapshots (on different days) to see your
                followers and following trend here.
              </p>
            )}
          </div>

          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Saved snapshots
              </h2>
              <div className="flex items-center gap-1 ml-auto">
                <button
                  type="button"
                  onClick={handleExport}
                  className="btn-ghost !px-2.5 text-sm leading-none text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
                >
                  <Save className="h-4 w-4" /> Export
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="btn-ghost !px-2.5 text-sm leading-none text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
                >
                  <FolderOpen className="h-4 w-4" /> Import
                </button>
                <button
                  type="button"
                  onClick={requestClearAll}
                  className="btn-ghost !px-2.5 text-sm leading-none text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                >
                  <Trash2 className="h-4 w-4" /> Clear all
                </button>
              </div>
            </div>
            <ul className="mt-3 space-y-2">
              {snapshots.map((s, i) => {
                // Show what changed to REACH this snapshot — compare it against
                // the previous (older) snapshot. The oldest has no baseline.
                const older = snapshots[i + 1];
                const cardDiff = older ? compareFollows(older, s) : null;
                return (
                <li
                  key={s.id}
                  className="card-hover flex items-center justify-between gap-3 p-4"
                >
                  <button
                    type="button"
                    onClick={() => setCompareId(s.id)}
                    className="min-w-0 flex-1 text-left"
                    title="See what changed in this snapshot"
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatWhen(s.savedAt)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {s.followers.length.toLocaleString()} followers ·{" "}
                      {s.following.length.toLocaleString()} following
                    </p>
                    {cardDiff && (
                      <div className="mt-2">
                        <SnapshotChanges diff={cardDiff} />
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => requestDelete(s)}
                    className="btn-ghost !px-2.5 text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                    aria-label="Delete snapshot"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </li>
                );
              })}
            </ul>
          </div>

        </>
      )}

      {/* Comparison modal — opens when a snapshot chip is clicked */}
      <Modal
        open={!!compareSnap}
        onClose={() => setCompareId(null)}
        title={compareSnap ? `Changes on ${formatWhen(compareSnap.savedAt)}` : ''}
      >
        {!olderSnap ? (
          <div className="p-2 text-center text-slate-600 dark:text-slate-300">
            <p>This is your earliest snapshot — there's nothing before it to compare against.</p>
          </div>
        ) : diff ? (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Compared against your previous snapshot ({formatWhen(olderSnap.savedAt)}).
            </p>
            <ScrollableTabs className="mt-4 gap-2" fadeClassName="from-white dark:from-[#14161f]">
              {MODAL_TABS.map((t) => {
                const count = diff[t.key].length;
                const active = modalTab === t.key;
                const Icon = t.Icon;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setModalTab(t.key)}
                    className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                      active
                        ? t.activeCls
                        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {t.label} ({count})
                  </button>
                );
              })}
            </ScrollableTabs>
            <div className="mt-4">
              {(() => {
                const t = MODAL_TABS.find((x) => x.key === modalTab)!;
                return (
                  <UserList
                    accounts={diff[t.key]}
                    emptyLabel={t.empty}
                    csvName={t.csv}
                    dateLabel={t.dateLabel}
                    virtualize={false}
                  />
                );
              })()}
            </div>
          </>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        confirmLabel={confirm?.confirmLabel}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          confirm?.onConfirm();
          setConfirm(null);
        }}
      />
    </div>
  );
}
