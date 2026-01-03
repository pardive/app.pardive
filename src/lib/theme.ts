export type ThemeMode = 'light' | 'dark';

/* ---------------- Apply theme ---------------- */
export function setTheme(mode: ThemeMode) {
  const root = document.documentElement;

  root.classList.toggle('dark', mode === 'dark');
  localStorage.setItem('theme', mode);
}

/* ---------------- Get saved theme ---------------- */
export function getTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';

  const saved = localStorage.getItem('theme');
  return saved === 'dark' ? 'dark' : 'light';
}

/* ---------------- Init theme on app load ---------------- */
export function initTheme() {
  const saved = getTheme();
  setTheme(saved);
}
