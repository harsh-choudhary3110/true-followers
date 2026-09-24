import type { Account, ParsedData, Snapshot } from './types';

/**
 * Snapshots are stored in IndexedDB (bigger quota than localStorage, handles
 * large accounts) as plain objects. Everything stays on the user's device — no
 * server, no upload. They are not encrypted: it's the user's own, regenerable
 * follower data, and the export/backup file is plain JSON anyway.
 */

const DB_NAME = 'truefollowers';
const STORE = 'snapshots';
const DB_VERSION = 1;
// A high safety limit — normal use never reaches it; it just stops storage from
// growing unbounded (e.g. a huge import). Oldest snapshots are trimmed first.
const MAX_SNAPSHOTS = 1000;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function putSnapshot(s: Snapshot): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(s);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

function delSnapshot(id: string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

/** Read all snapshots, newest first. Safe if IndexedDB is unavailable. */
export async function loadSnapshots(): Promise<Snapshot[]> {
  try {
    const db = await openDb();
    const all = await new Promise<Snapshot[]>((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result as Snapshot[]) ?? []);
      req.onerror = () => reject(req.error);
    });
    return all.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  } catch {
    return [];
  }
}

/** Keep only the newest MAX_SNAPSHOTS, deleting the oldest beyond the cap. */
async function trimToCap(): Promise<void> {
  const all = await loadSnapshots();
  if (all.length <= MAX_SNAPSHOTS) return;
  for (const s of all.slice(MAX_SNAPSHOTS)) await delSnapshot(s.id);
}

/** True if two account lists contain exactly the same usernames. */
function sameAccounts(a: Account[], b: Account[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a.map((x) => x.username));
  return b.every((x) => set.has(x.username));
}

export interface SaveResult {
  snapshots: Snapshot[];
  /** false when skipped because nothing changed since the latest snapshot. */
  saved: boolean;
}

/**
 * Save the current data as a new snapshot — unless it's identical to the most
 * recent snapshot (same followers and following), in which case it's skipped.
 */
export async function saveSnapshot(data: ParsedData): Promise<SaveResult> {
  const existing = await loadSnapshots();
  const latest = existing[0];
  if (
    latest &&
    sameAccounts(latest.followers, data.followers) &&
    sameAccounts(latest.following, data.following)
  ) {
    return { snapshots: existing, saved: false };
  }
  const snapshot: Snapshot = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    followers: data.followers,
    following: data.following,
  };
  try {
    await putSnapshot(snapshot);
    await trimToCap();
  } catch {
    return { snapshots: existing, saved: false };
  }
  return { snapshots: await loadSnapshots(), saved: true };
}

/** Delete a snapshot by id and return the updated list. */
export async function deleteSnapshot(id: string): Promise<Snapshot[]> {
  try {
    await delSnapshot(id);
  } catch {
    // ignore
  }
  return loadSnapshots();
}

/** Delete every snapshot. */
export async function clearSnapshots(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

function normalizeAccount(x: unknown): Account | null {
  if (!x || typeof x !== 'object') return null;
  const a = x as Record<string, unknown>;
  const raw =
    typeof a.username === 'string' ? a.username : typeof a.value === 'string' ? a.value : '';
  const username = raw.trim();
  if (!username) return null;
  return {
    username: username.toLowerCase(),
    displayName: typeof a.displayName === 'string' && a.displayName.trim() ? a.displayName : username,
    href: typeof a.href === 'string' ? a.href : `https://www.instagram.com/${username}`,
    timestamp: typeof a.timestamp === 'number' && a.timestamp > 0 ? a.timestamp : null,
  };
}

function normalizeSnapshot(x: unknown): Snapshot | null {
  if (!x || typeof x !== 'object') return null;
  const s = x as Record<string, unknown>;
  if (!Array.isArray(s.followers) || !Array.isArray(s.following)) return null;
  const followers = s.followers.map(normalizeAccount).filter((a): a is Account => a !== null);
  const following = s.following.map(normalizeAccount).filter((a): a is Account => a !== null);
  if (followers.length === 0 && following.length === 0) return null;
  const savedAt =
    typeof s.savedAt === 'string' && !Number.isNaN(Date.parse(s.savedAt))
      ? s.savedAt
      : new Date().toISOString();
  return {
    id: typeof s.id === 'string' ? s.id : crypto.randomUUID(),
    savedAt,
    followers,
    following,
  };
}

const EXPORT_HINT =
  'This looks like an Instagram export, not a snapshots backup. Head to the Upload page to analyze it.';

// Detect an Instagram data export so we can point the user to the right page.
function looksLikeInstagramExport(x: unknown): boolean {
  const hasEntry = (arr: unknown) =>
    Array.isArray(arr) &&
    arr.some((it) => it && typeof it === 'object' && 'string_list_data' in (it as object));
  if (hasEntry(x)) return true;
  if (x && typeof x === 'object') {
    const keys = Object.keys(x as object);
    if (keys.some((k) => k.startsWith('relationships_'))) return true;
    return Object.values(x as Record<string, unknown>).some(hasEntry);
  }
  return false;
}

/** Export all snapshots as a portable JSON string (for moving between devices). */
export async function exportSnapshotsJson(): Promise<string> {
  const snapshots = await loadSnapshots();
  return JSON.stringify(
    { app: 'truefollowers', kind: 'snapshots', version: 1, exportedAt: new Date().toISOString(), snapshots },
    null,
    2,
  );
}

export interface ImportResult {
  snapshots: Snapshot[];
  added: number;
  skipped: number;
}

/**
 * Import snapshots from an exported JSON file, merging with existing ones
 * (deduped by id). Returns the updated list plus counts.
 */
export async function importSnapshotsJson(text: string): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  const raw = Array.isArray(parsed) ? parsed : (parsed as { snapshots?: unknown }).snapshots;
  if (!Array.isArray(raw)) {
    throw new Error(
      looksLikeInstagramExport(parsed)
        ? EXPORT_HINT
        : "Couldn't find any snapshots in that file. Is this a snapshots backup?",
    );
  }
  const incoming = raw.map(normalizeSnapshot).filter((s): s is Snapshot => s !== null);
  if (incoming.length === 0) {
    throw new Error(
      looksLikeInstagramExport(parsed) ? EXPORT_HINT : 'No valid snapshots found in that file.',
    );
  }

  const existingIds = new Set((await loadSnapshots()).map((s) => s.id));
  let added = 0;
  let skipped = 0;
  for (const s of incoming) {
    if (existingIds.has(s.id)) {
      skipped++;
      continue;
    }
    await putSnapshot(s);
    existingIds.add(s.id);
    added++;
  }
  await trimToCap();
  return { snapshots: await loadSnapshots(), added, skipped };
}
