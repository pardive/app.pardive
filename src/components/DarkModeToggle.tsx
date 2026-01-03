'use client';

import { useEffect, useState } from 'react';
import { getTheme, setTheme, ThemeMode } from '@/lib/theme';

export default function DarkModeToggle() {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    setMode(getTheme());
  }, []);

  const toggle = () => {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setMode(next);
  };

  return (
    <button
      onClick={toggle}
      className="
        fixed bottom-4 right-4 z-50
        px-4 py-2 rounded-full text-sm font-medium
        shadow-lg transition-colors
        bg-card text-primary border border-default
        hover:bg-ui-hoverBG dark:hover:bg-ui-hoverBGDark
      "
    >
      {mode === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
    </button>
  );
}
