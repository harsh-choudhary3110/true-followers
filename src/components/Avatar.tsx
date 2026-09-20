// Deterministic color from a username so avatars are stable across renders.
const palette = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-fuchsia-500',
];

function colorFor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
}

export default function Avatar({ username }: { username: string }) {
  // First letter/digit, skipping leading special chars like "_" or "."
  const initial = (username.match(/[a-z0-9]/i)?.[0] ?? '?').toUpperCase();
  return (
    <span
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${colorFor(
        username,
      )}`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
