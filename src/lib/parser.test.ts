import { describe, expect, it } from 'vitest';
import { buildParsedData, parseAccountsFromHtml, parseAccountsFromJson } from './parser';
import { compare, diffSnapshot, filterAndSort } from './diff';
import type { Snapshot } from './types';

// Real-shape fixtures matching Instagram's JSON export.
const followersJson = JSON.stringify([
  {
    title: '',
    media_list_data: [],
    string_list_data: [
      { href: 'https://www.instagram.com/alice', value: 'alice', timestamp: 1600000000 },
    ],
  },
  {
    string_list_data: [
      { href: 'https://www.instagram.com/bob', value: 'bob', timestamp: 1600000100 },
    ],
  },
  {
    // duplicate of alice with a later timestamp — should be de-duped to earliest
    string_list_data: [
      { href: 'https://www.instagram.com/alice', value: 'alice', timestamp: 1600009999 },
    ],
  },
]);

const followingJson = JSON.stringify({
  relationships_following: [
    {
      string_list_data: [
        { href: 'https://www.instagram.com/bob', value: 'bob', timestamp: 1600000200 },
      ],
    },
    {
      string_list_data: [
        { href: 'https://www.instagram.com/carol', value: 'carol', timestamp: 1600000300 },
      ],
    },
  ],
});

describe('parseAccountsFromJson', () => {
  it('parses a bare followers array', () => {
    const accounts = parseAccountsFromJson(followersJson);
    expect(accounts.map((a) => a.username).sort()).toEqual(['alice', 'bob']);
  });

  it('parses the following object shape', () => {
    const accounts = parseAccountsFromJson(followingJson);
    expect(accounts.map((a) => a.username).sort()).toEqual(['bob', 'carol']);
  });

  it('de-dupes keeping the earliest timestamp', () => {
    const accounts = parseAccountsFromJson(followersJson);
    const alice = accounts.find((a) => a.username === 'alice');
    expect(alice?.timestamp).toBe(1600000000);
  });

  it('lowercases usernames but keeps a display name', () => {
    const json = JSON.stringify([{ string_list_data: [{ value: 'CoolUser' }] }]);
    const [acc] = parseAccountsFromJson(json);
    expect(acc.username).toBe('cooluser');
    expect(acc.displayName).toBe('CoolUser');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseAccountsFromJson('{not json')).toThrow();
  });

  it('skips entries with no username', () => {
    const json = JSON.stringify([{ string_list_data: [{ value: '' }] }, { string_list_data: [] }]);
    expect(parseAccountsFromJson(json)).toHaveLength(0);
  });
});

const followersHtml = `
<html><body>
  <div class="pam">
    <a href="https://www.instagram.com/alice/" target="_blank">alice</a>
    <div>September 1, 2020</div>
  </div>
  <div class="pam">
    <a href="https://www.instagram.com/bob" target="_blank">bob</a>
  </div>
  <footer><a href="https://www.instagram.com/legal/">Instagram</a></footer>
</body></html>`;

describe('parseAccountsFromHtml', () => {
  it('extracts usernames from profile links', () => {
    const accounts = parseAccountsFromHtml(followersHtml);
    expect(accounts.map((a) => a.username).sort()).toEqual(['alice', 'bob']);
  });

  it('skips reserved handles like /legal', () => {
    const accounts = parseAccountsFromHtml(followersHtml);
    expect(accounts.map((a) => a.username)).not.toContain('legal');
  });

  it('leaves timestamps null (HTML has no reliable date)', () => {
    const [acc] = parseAccountsFromHtml(followersHtml);
    expect(acc.timestamp).toBeNull();
  });
});

describe('buildParsedData with HTML files', () => {
  it('parses .html followers/following the same as JSON', () => {
    const followingHtml = `<a href="https://www.instagram.com/bob">bob</a>
      <a href="https://www.instagram.com/carol">carol</a>`;
    const data = buildParsedData({
      'connections/followers_and_following/followers_1.html': followersHtml,
      'connections/followers_and_following/following.html': followingHtml,
    });
    expect(data.followers.map((a) => a.username).sort()).toEqual(['alice', 'bob']);
    expect(data.following.map((a) => a.username).sort()).toEqual(['bob', 'carol']);
    expect(data.warnings).toHaveLength(0);
  });

  it('handles a mixed export (followers JSON, following HTML)', () => {
    const data = buildParsedData({
      'followers_1.json': followersJson,
      'following.html': '<a href="https://www.instagram.com/carol">carol</a>',
    });
    expect(data.followers.length).toBe(2);
    expect(data.following.map((a) => a.username)).toEqual(['carol']);
  });
});

describe('following.json shape (title + /_u/ href, no value)', () => {
  const followingRealShape = JSON.stringify({
    relationships_following: [
      {
        title: 'sampleuser1',
        string_list_data: [
          { href: 'https://www.instagram.com/_u/sampleuser1', timestamp: 1785572236 },
        ],
      },
      {
        title: 'CoolUser',
        string_list_data: [{ href: 'https://www.instagram.com/_u/CoolUser', timestamp: 1 }],
      },
    ],
  });

  it('reads usernames from title / _u href when value is missing', () => {
    const accounts = parseAccountsFromJson(followingRealShape);
    expect(accounts.map((a) => a.username).sort()).toEqual(['cooluser', 'sampleuser1']);
  });

  it('canonicalizes the href (drops the /_u/ prefix)', () => {
    const [acc] = parseAccountsFromJson(followingRealShape);
    expect(acc.href).toBe('https://www.instagram.com/sampleuser1');
  });
});

describe('HTML export with /_u/ prefix', () => {
  it('extracts the real username after /_u/', () => {
    const html =
      '<a href="https://www.instagram.com/_u/alice">alice</a>' +
      '<a href="https://www.instagram.com/_u/bob">bob</a>';
    expect(parseAccountsFromHtml(html).map((a) => a.username).sort()).toEqual(['alice', 'bob']);
  });
});

describe('buildParsedData', () => {
  it('classifies files by name and warns on missing ones', () => {
    const data = buildParsedData({
      'connections/followers_and_following/followers_1.json': followersJson,
    });
    expect(data.followers).toHaveLength(2);
    expect(data.following).toHaveLength(0);
    expect(data.warnings.some((w) => w.includes('following'))).toBe(true);
  });

  it('merges paginated follower files', () => {
    const page1 = JSON.stringify([{ string_list_data: [{ value: 'alice' }] }]);
    const page2 = JSON.stringify([{ string_list_data: [{ value: 'dave' }] }]);
    const data = buildParsedData({
      'followers_1.json': page1,
      'followers_2.json': page2,
      'following.json': followingJson,
    });
    expect(data.followers.map((a) => a.username).sort()).toEqual(['alice', 'dave']);
  });
});

describe('compare', () => {
  const data = buildParsedData({
    'followers_1.json': followersJson,
    'following.json': followingJson,
  });
  const result = compare(data);

  it('finds who does not follow you back', () => {
    // you follow bob & carol; only bob follows back -> carol
    expect(result.notFollowingBack.map((a) => a.username)).toEqual(['carol']);
  });

  it('finds who you do not follow back', () => {
    // alice & bob follow you; you only follow bob -> alice
    expect(result.notFollowedBack.map((a) => a.username)).toEqual(['alice']);
  });

  it('finds mutuals', () => {
    expect(result.mutuals.map((a) => a.username)).toEqual(['bob']);
  });

  it('computes counts and ratio', () => {
    expect(result.counts.followers).toBe(2);
    expect(result.counts.following).toBe(2);
    expect(result.counts.ratio).toBe(1);
  });

  it('handles zero followers without dividing by zero', () => {
    const empty = buildParsedData({ 'following.json': followingJson });
    expect(compare(empty).counts.ratio).toBeNull();
  });
});

describe('diffSnapshot', () => {
  it('detects lost and new followers', () => {
    const previous: Snapshot = {
      id: '1',
      savedAt: '2024-01-01T00:00:00.000Z',
      followers: parseAccountsFromJson(
        JSON.stringify([
          { string_list_data: [{ value: 'alice' }] },
          { string_list_data: [{ value: 'bob' }] },
        ]),
      ),
      following: [],
    };
    const current = buildParsedData({
      'followers_1.json': JSON.stringify([
        { string_list_data: [{ value: 'bob' }] },
        { string_list_data: [{ value: 'carol' }] },
      ]),
      'following.json': followingJson,
    });
    const { lostFollowers, newFollowers } = diffSnapshot(previous, current);
    expect(lostFollowers.map((a) => a.username)).toEqual(['alice']);
    expect(newFollowers.map((a) => a.username)).toEqual(['carol']);
  });
});

describe('filterAndSort', () => {
  const accounts = parseAccountsFromJson(followersJson);

  it('filters by substring', () => {
    expect(filterAndSort(accounts, 'ali', 'username', 'asc').map((a) => a.username)).toEqual([
      'alice',
    ]);
  });

  it('sorts by username descending', () => {
    expect(filterAndSort(accounts, '', 'username', 'desc').map((a) => a.username)).toEqual([
      'bob',
      'alice',
    ]);
  });

  it('sorts by date ascending', () => {
    expect(filterAndSort(accounts, '', 'date', 'asc').map((a) => a.username)).toEqual([
      'alice',
      'bob',
    ]);
  });
});
