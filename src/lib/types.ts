/** A single account, normalized from Instagram's export format. */
export interface Account {
  /** Instagram username, lowercased for reliable set comparison. */
  username: string;
  /** Original-cased username for display (Instagram usernames are lowercase, but be safe). */
  displayName: string;
  /** Profile URL from the export, if present. */
  href: string;
  /** Unix seconds when the relationship was formed, if present. */
  timestamp: number | null;
}

/** The relationship buckets Instagram gives us, all normalized. */
export interface ParsedData {
  followers: Account[];
  following: Account[];
  /** Non-fatal warnings surfaced to the user (e.g. missing files). */
  warnings: string[];
}

/** The computed comparison result shown on the dashboard. */
export interface Comparison {
  notFollowingBack: Account[]; // you follow them, they don't follow you
  notFollowedBack: Account[]; // they follow you, you don't follow back
  mutuals: Account[]; // follow each other
  counts: {
    followers: number;
    following: number;
    mutuals: number;
    notFollowingBack: number;
    notFollowedBack: number;
    /** following / followers, or null if no followers. */
    ratio: number | null;
  };
}

/** A saved point-in-time snapshot for unfollower tracking. */
export interface Snapshot {
  id: string;
  /** ISO date string when the snapshot was saved. */
  savedAt: string;
  followers: Account[];
  following: Account[];
}
