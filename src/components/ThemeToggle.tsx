import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useStore } from '../store';

export default function ThemeToggle() {
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);

  // SSR/first-client render must match (theme is unknown until mounted),
  // so we render the neutral "light" state until hydration completes.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="btn-ghost !px-2.5"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
