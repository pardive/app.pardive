'use client';

import { useTheme } from 'next-themes';
import { SunMoon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  inline?: boolean;
  collapsed?: boolean;
}

export default function ThemeToggle({ inline = false, collapsed = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const label = theme === 'dark' ? 'Light Mode' : 'Dark Mode';

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-2 text-sm rounded-md transition-colors ${
        inline
          ? 'w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
          : 'w-full px-3 py-3 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
      }`}
    >
      <SunMoon className="w-5 h-5 stroke-[2.5]" />
      {!collapsed && <span className="text-sm">{label}</span>}
    </button>
  );
}
