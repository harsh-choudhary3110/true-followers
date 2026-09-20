import type { Account, Comparison, ParsedData } from './types';

/** Build a username -> Account map for fast lookups. */
function toMap(accounts: Account[]): Map<string, Account> {
  return new Map(accounts.map((a) => [a.username, a]));
}

/**
 * Core comparison. Set math on usernames:
 *   notFollowingBack = following - followers
 *   notFollowedBack  = followers - following
 *   mutuals          = following ∩ followers
 */
export function compare(data: ParsedData): Comparison {
  const followerMap = toMap(data.followers);
  const followingMap = toMap(data.following);

  const notFollowingBack = data.following.filter((a) => !followerMap.has(a.username));
  const notFollowedBack = data.followers.filter((a) => !followingMap.has(a.username));
  const mutuals = data.following.filter((a) => followerMap.has(a.username));

  const followers = data.followers.length;
  const following = data.following.length;

  return {
    notFollowingBack,
    notFollowedBack,
    mutuals,
    counts: {
      followers,
      following,
      mutuals: mutuals.length,
      notFollowingBack: notFollowingBack.length,
      notFollowedBack: notFollowedBack.length,
      ratio: followers > 0 ? following / followers : null,
    },
  };
}

/**
 * Diff a newer follower list against an older snapshot.
 * Returns who unfollowed (in old, not in new) and who's new (in new, not in old).
 */
export function diffSnapshot(
  previous: { followers: Account[] },
  current: { followers: Account[] },
): { lostFollowers: Account[]; newFollowers: Account[] } {
  const oldMap = toMap(previous.followers);
  const newMap = toMap(current.followers);

  const lostFollowers = previous.followers.filter((a) => !newMap.has(a.username));
  const newFollowers = current.followers.filter((a) => !oldMap.has(a.username));

  return { lostFollowers, newFollowers };
}

export interface FollowDiff {
  lostFollowers: Account[]; // unfollowed you
  newFollowers: Account[]; // new followers
  unfollowedByYou: Account[]; // you unfollowed
  followedByYou: Account[]; // you followed
}

/** Full follower + following diff between an older and a newer state. */
export function compareFollows(
  previous: { followers: Account[]; following: Account[] },
  current: { followers: Account[]; following: Account[] },
): FollowDiff {
  const prevFollowers = toMap(previous.followers);
  const curFollowers = toMap(current.followers);
  const prevFollowing = toMap(previous.following);
  const curFollowing = toMap(current.following);

  return {
    lostFollowers: previous.followers.filter((a) => !curFollowers.has(a.username)),
    newFollowers: current.followers.filter((a) => !prevFollowers.has(a.username)),
    unfollowedByYou: previous.following.filter((a) => !curFollowing.has(a.username)),
    followedByYou: current.following.filter((a) => !prevFollowing.has(a.username)),
  };
}

export type SortKey = 'username' | 'date';
export type SortDir = 'asc' | 'desc';

/** Filter by a case-insensitive username substring and sort. */
export function filterAndSort(
  accounts: Account[],
  query: string,
  sortKey: SortKey,
  dir: SortDir,
): Account[] {
  // Usernames are stored without a leading "@", so ignore one if the user types it.
  const q = query.trim().toLowerCase().replace(/^@+/, '');
  const filtered = q ? accounts.filter((a) => a.username.includes(q)) : accounts.slice();

  filtered.sort((a, b) => {
    let cmp: number;
    if (sortKey === 'username') {
      cmp = a.username.localeCompare(b.username);
    } else {
      // Nulls sort last regardless of direction.
      const ta = a.timestamp ?? -Infinity;
      const tb = b.timestamp ?? -Infinity;
      cmp = ta - tb;
    }
    return dir === 'asc' ? cmp : -cmp;
  });

  return filtered;
}
