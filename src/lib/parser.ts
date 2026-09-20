import JSZip from "jszip";
import type { Account, ParsedData } from "./types";

/**
 * Instagram's "Download Your Information" export (JSON format) stores follow
 * relationships under connections/followers_and_following/. The two shapes are:
 *
 *   followers_1.json  -> a top-level ARRAY of entries
 *   following.json    -> { "relationships_following": [ ...entries ] }
 *
 * Each entry looks like:
 *   {
 *     "title": "",
 *     "media_list_data": [],
 *     "string_list_data": [
 *       { "href": "https://www.instagram.com/user", "value": "user", "timestamp": 1620000000 }
 *     ]
 *   }
 *
 * Older / regional exports sometimes wrap the array under a named key too, so we
 * normalize defensively rather than trusting an exact shape.
 */

interface RawStringListItem {
  href?: string;
  value?: string;
  timestamp?: number;
}

interface RawEntry {
  title?: string;
  string_list_data?: RawStringListItem[];
}

export class ParseError extends Error {}

/** Pull the username out of an Instagram href, handling the /_u/ profile prefix. */
function usernameFromHref(href?: string): string {
  if (!href) return "";
  const m = href.match(/instagram\.com\/(?:_u\/)?([A-Za-z0-9._]+)/i);
  return m ? m[1] : "";
}

/** Turn one raw export entry into a normalized Account, or null if unusable. */
function normalizeEntry(entry: RawEntry): Account | null {
  const item = entry?.string_list_data?.[0];
  // The username lives in string_list_data.value (followers.json), or in the
  // entry's title (following.json), or must be derived from the href — whose URL
  // sometimes uses an /_u/<username> prefix.
  let raw = (item?.value ?? "").trim();
  if (!raw && typeof entry?.title === "string") raw = entry.title.trim();
  if (!raw) raw = usernameFromHref(item?.href);
  if (!raw) return null;
  return {
    username: raw.toLowerCase(),
    displayName: raw,
    href: `https://www.instagram.com/${raw}`,
    timestamp:
      typeof item?.timestamp === "number" && item.timestamp > 0
        ? item.timestamp
        : null,
  };
}

/**
 * Pull an array of raw entries out of arbitrary parsed JSON. Handles:
 *  - a bare array (followers_*.json)
 *  - an object with a single array value (following.json, etc.)
 */
function extractEntries(json: unknown): RawEntry[] {
  if (Array.isArray(json)) return json as RawEntry[];
  if (json && typeof json === "object") {
    for (const value of Object.values(json as Record<string, unknown>)) {
      if (Array.isArray(value)) return value as RawEntry[];
    }
  }
  return [];
}

/** De-duplicate accounts by username, keeping the earliest known timestamp. */
function dedupe(accounts: Account[]): Account[] {
  const map = new Map<string, Account>();
  for (const acc of accounts) {
    const existing = map.get(acc.username);
    if (!existing) {
      map.set(acc.username, acc);
    } else if (
      acc.timestamp &&
      (!existing.timestamp || acc.timestamp < existing.timestamp)
    ) {
      map.set(acc.username, acc);
    }
  }
  return [...map.values()];
}

/** Parse raw JSON text into normalized accounts. Throws ParseError on bad JSON. */
export function parseAccountsFromJson(text: string): Account[] {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ParseError("That file is not valid JSON.");
  }
  const entries = extractEntries(json);
  return dedupe(
    entries.map(normalizeEntry).filter((a): a is Account => a !== null),
  );
}

// Instagram paths that are not usernames — skip these when scraping HTML links.
const RESERVED_HANDLES = new Set([
  "p",
  "reel",
  "reels",
  "explore",
  "stories",
  "accounts",
  "about",
  "legal",
  "privacy",
  "terms",
  "directory",
  "developer",
  "help",
  "web",
  "direct",
  "_u",
]);

/**
 * Parse the HTML export format. Instagram lists each account as a profile link
 * (`<a href="https://www.instagram.com/username">username</a>`), so we pull every
 * instagram.com/<handle> URL out of the markup. The HTML format has no reliable
 * per-account timestamp, so those are left null.
 */
export function parseAccountsFromHtml(text: string): Account[] {
  const re = /https?:\/\/(?:www\.)?instagram\.com\/(?:_u\/)?([A-Za-z0-9._]+)\/?/gi;
  const accounts: Account[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const raw = match[1];
    if (RESERVED_HANDLES.has(raw.toLowerCase())) continue;
    accounts.push({
      username: raw.toLowerCase(),
      displayName: raw,
      href: `https://www.instagram.com/${raw}`,
      timestamp: null,
    });
  }
  return dedupe(accounts);
}

/** Route a file to the right parser based on its extension (.json or .html). */
export function parseAccountsFromFile(name: string, text: string): Account[] {
  return /\.html?$/i.test(name)
    ? parseAccountsFromHtml(text)
    : parseAccountsFromJson(text);
}

/** Heuristics for classifying a filename inside the export (JSON or HTML). */
const isFollowersFile = (name: string) =>
  /followers(_\d+)?\.(json|html?)$/i.test(name);
const isFollowingFile = (name: string) =>
  /following\.(json|html?)$/i.test(name);

/**
 * Build a ParsedData result from a map of relevant filename -> file text.
 * This is the pure core so it can be unit-tested without a real ZIP.
 */
export function buildParsedData(files: Record<string, string>): ParsedData {
  const followers: Account[] = [];
  const following: Account[] = [];
  const warnings: string[] = [];

  let sawFollowers = false;
  let sawFollowing = false;

  for (const [name, text] of Object.entries(files)) {
    try {
      if (isFollowersFile(name)) {
        followers.push(...parseAccountsFromFile(name, text));
        sawFollowers = true;
      } else if (isFollowingFile(name)) {
        following.push(...parseAccountsFromFile(name, text));
        sawFollowing = true;
      }
    } catch {
      warnings.push(
        `Could not read ${name.split("/").pop()} — it may be corrupted.`,
      );
    }
  }

  if (!sawFollowers) {
    warnings.push("No followers file found (expected followers_1.json).");
  }
  if (!sawFollowing) {
    warnings.push("No following file found (expected following.json).");
  }

  return {
    followers: dedupe(followers),
    following: dedupe(following),
    warnings,
  };
}

/** True if the filename is one we read (only followers & following). */
function isRelevantFile(name: string): boolean {
  return isFollowersFile(name) || isFollowingFile(name);
}

/**
 * Parse an uploaded Instagram export ZIP. Extracts the relationship files —
 * whether the export is in JSON or HTML format — and hands them to buildParsedData.
 */
export async function parseZip(file: File | Blob): Promise<ParsedData> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new ParseError("That file is not a valid ZIP archive.");
  }

  const files: Record<string, string> = {};
  let sawAny = false;

  const entries = Object.values(zip.files).filter((f) => !f.dir);
  for (const entry of entries) {
    if (isRelevantFile(entry.name)) {
      files[entry.name] = await entry.async("string");
      sawAny = true;
    }
  }

  if (!sawAny) {
    throw new ParseError(
      "Couldn't find any followers/following files in this ZIP. Make sure it's your Instagram data export (JSON or HTML format).",
    );
  }

  return buildParsedData(files);
}

/**
 * Parse a set of loose files the user dropped: a ZIP, or individual .json / .html
 * followers and following files.
 */
export async function parseFiles(fileList: File[]): Promise<ParsedData> {
  const zipFile = fileList.find((f) => /\.zip$/i.test(f.name));
  if (zipFile) return parseZip(zipFile);

  const dataFiles = fileList.filter((f) => /\.(json|html?)$/i.test(f.name));
  if (dataFiles.length === 0) {
    throw new ParseError(
      "Please upload your Instagram export ZIP, or the followers/following files (.json or .html).",
    );
  }

  const files: Record<string, string> = {};
  for (const f of dataFiles) {
    files[f.name] = await f.text();
  }
  return buildParsedData(files);
}
