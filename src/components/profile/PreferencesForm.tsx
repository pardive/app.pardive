'use client';

import { useEffect, useState } from 'react';

type Prefs = {
  theme: 'system' | 'light' | 'dark';
  comm_email: boolean;
  comm_phone: boolean;
  comm_whatsapp: boolean;
};

export default function PreferencesForm() {
  const [saving, setSaving] = useState(false);
  const [p, setP] = useState<Prefs>({
    theme: 'system',
    comm_email: true,
    comm_phone: false,
    comm_whatsapp: false,
  });

  // Initialize from system
  useEffect(() => {
    setTheme(p.theme);
    // Optionally prefill via GET /api/preferences/me
  }, []);

  function setTheme(next: Prefs['theme']) {
    setP((old) => ({ ...old, theme: next }));
    const root = document.documentElement;
    if (next === 'dark') root.classList.add('dark');
    else if (next === 'light') root.classList.remove('dark');
    else {
      // system
      const isDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', !!isDark);
    }
  }

  async function onSave() {
    setSaving(true);
    try {
      // await fetch('/api/preferences/update', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(p) });
      alert('Saved (stub). Replace with /api/preferences/update');
    } catch (e: any) {
      alert(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-[#00332D] dark:text-white">Preferences</h1>
      <p className="text-sm text-neutral-500 mt-1">Theme and communication settings.</p>

      <div className="mt-6 space-y-8">
        <section>
          <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Theme</h2>
          <div className="mt-3 flex gap-3">
            <ThemePill selected={p.theme === 'system'} onClick={() => setTheme('system')}>
              System
            </ThemePill>
            <ThemePill selected={p.theme === 'light'} onClick={() => setTheme('light')}>
              Light
            </ThemePill>
            <ThemePill selected={p.theme === 'dark'} onClick={() => setTheme('dark')}>
              Dark
            </ThemePill>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Communication preferences
          </h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Toggle
              label="Email"
              checked={p.comm_email}
              onChange={(v) => setP((o) => ({ ...o, comm_email: v }))}
            />
            <Toggle
              label="Phone"
              checked={p.comm_phone}
              onChange={(v) => setP((o) => ({ ...o, comm_phone: v }))}
            />
            <Toggle
              label="WhatsApp"
              checked={p.comm_whatsapp}
              onChange={(v) => setP((o) => ({ ...o, comm_whatsapp: v }))}
            />
          </div>
        </section>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center px-4 h-10 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
      </div>
    </div>
  );
}

function ThemePill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        'px-4 h-9 rounded-full border text-sm ' +
        (selected
          ? 'bg-emerald-600 text-white border-emerald-600'
          : 'bg-transparent text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60')
      }
    >
      {children}
    </button>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-lg border border-neutral-200 dark:border-neutral-800 px-3 py-2">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
    </label>
  );
}
