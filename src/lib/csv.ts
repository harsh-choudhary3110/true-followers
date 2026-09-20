import type { Account } from './types';

function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Build CSV text for a list of accounts. */
export function accountsToCsv(accounts: Account[]): string {
  const header = ['username', 'profile_url', 'since'];
  const rows = accounts.map((a) => [
    a.username,
    a.href,
    a.timestamp ? new Date(a.timestamp * 1000).toISOString().slice(0, 10) : '',
  ]);
  return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n');
}

/** Trigger a browser download of the given CSV content. */
export function downloadCsv(filename: string, accounts: Account[]): void {
  const csv = accountsToCsv(accounts);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
