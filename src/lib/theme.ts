import { useCallback, useState } from 'react';

export type Theme = 'dark' | 'light';
const STORAGE_KEY = 'vrcdevkit.theme';

function initialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return 'dark'; // dark by default, by design
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    const t = initialTheme();
    document.documentElement.dataset.theme = t;
    return t;
  });
  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.dataset.theme = next;
      return next;
    });
  }, []);
  return [theme, toggle];
}
