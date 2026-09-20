import { create } from 'zustand';
import type { Comparison, ParsedData } from './lib/types';
import { compare } from './lib/diff';

type Theme = 'light' | 'dark';

interface AppState {
  data: ParsedData | null;
  comparison: Comparison | null;
  setData: (data: ParsedData) => void;
  reset: () => void;

  theme: Theme;
  toggleTheme: () => void;
}

function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem('tf-theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  try {
    localStorage.setItem('tf-theme', theme);
  } catch {
    // ignore
  }
}

export const useStore = create<AppState>((set, get) => ({
  data: null,
  comparison: null,
  setData: (data) => set({ data, comparison: compare(data) }),
  reset: () => set({ data: null, comparison: null }),

  theme: initialTheme(),
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    set({ theme: next });
  },
}));
