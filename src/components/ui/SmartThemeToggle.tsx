'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'ui:theme';
const NEXT: Record<ThemeMode, ThemeMode> = { light: 'dark', dark: 'system', system: 'light' };

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'light') root.classList.remove('dark');
  else if (mode === 'dark') root.classList.add('dark');
  else root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
}

export default function SmartThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // load
  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system';
    setMode(saved);
  }, []);

  // apply + persist + watch system
  useEffect(() => {
    applyTheme(mode);
    localStorage.setItem(STORAGE_KEY, mode);

    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, [mode]);

  // close on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!open) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const Seg = useMemo(
    () =>
      ({
        light: Sun,
        dark: Moon,
        system: Monitor,
      })[mode],
    [mode]
  );

  function select(next: ThemeMode) {
    setMode(next);
    setOpen(false);
  }

  return (
    <div className={clsx('relative inline-flex items-center', className)}>
      {/* Pill with 3 icons */}
      <div
        className="flex items-center rounded-full border bg-background p-1 shadow-sm"
        role="group"
        aria-label="Theme selection"
      >
        {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => {
          const Icon = m === 'light' ? Sun : m === 'dark' ? Moon : Monitor;
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              aria-pressed={active}
              title={m === 'system' ? 'Sync with system' : m[0].toUpperCase() + m.slice(1)}
              className={clsx(
                'h-8 w-8 rounded-full flex items-center justify-center transition',
                active ? 'bg-foreground/90 text-background' : 'hover:bg-muted/60'
              )}
              onClick={() => select(m)}
              onAuxClick={(e) => {
                // middle/cmd click cycles
                e.preventDefault();
                setMode((cur) => NEXT[cur]);
              }}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
        {/* Click anywhere on pill background (not the buttons) to open menu */}
        <button
          type="button"
          aria-label="Open theme menu"
          className="sr-only"
          onClick={() => setOpen((v) => !v)}
        />
      </div>

      {/* Dropdown menu with labels */}
      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-[115%] z-50 w-48 rounded-lg border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
          role="menu"
        >
          {(
            [
              { key: 'light', label: 'Light', icon: Sun },
              { key: 'dark', label: 'Dark', icon: Moon },
              { key: 'system', label: 'Sync with system', icon: Monitor },
            ] as const
          ).map(({ key, label, icon: Icon }) => {
            const active = mode === key;
            return (
              <button
                key={key}
                role="menuitemradio"
                aria-checked={active}
                className={clsx(
                  'w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm',
                  active ? 'bg-emerald-600 text-white' : 'hover:bg-muted/70'
                )}
                onClick={() => select(key)}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{label}</span>
                {active && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
