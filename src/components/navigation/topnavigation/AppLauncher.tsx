'use client';

import {
  Megaphone,
  Database,
  PanelsTopLeft,
  BarChart3,
  Code2,
  Layers,
  ChevronDown,
} from 'lucide-react';

import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

type AppItem = {
  key: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type App = {
  key: string;
  label: string;
};

type Props = {
  selected: App;
  onSelect?: (app: App) => void;
  collapsed?: boolean;
};

const APPS: AppItem[] = [
  { key: 'builder', label: 'Builder', icon: Layers },
  { key: 'data', label: 'Data Manager', icon: Database },
  { key: 'integrations', label: 'Integrations', icon: Code2 },
  { key: 'intelligence', label: 'Intelligence', icon: BarChart3 },
  { key: 'marketing', label: 'Marketing', icon: Megaphone },
  { key: 'workspace', label: 'Workspace', icon: PanelsTopLeft },
];

function useMounted() {
  const [m, set] = useState(false);
  useEffect(() => set(true), []);
  return m;
}

export default function AppLauncher({
  selected,
  onSelect,
  collapsed = false, // accepted for layout compatibility
}: Props) {
  const mounted = useMounted();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  // Resolve selected app safely
  const selectedApp =
    APPS.find((a) => a.key === selected.key) ?? APPS[0];

  const Icon = selectedApp.icon;

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setOpen(false);
    };

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openMenu = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left, width: 200 });
    setOpen(true);
  };

  return (
    <>
      {/* Trigger */}
      <button
        ref={btnRef}
        onClick={openMenu}
        className={clsx(
          'h-10 w-full px-3 rounded-sm',
          'inline-flex items-center gap-2',
          'border border-gray-300 dark:border-gray-700',
          'bg-white dark:bg-ui-navigationDark',
          'hover:bg-gray-100 dark:hover:bg-[#1f2937]'
        )}
      >
        <Icon className="w-5 h-5 text-gray-800 dark:text-gray-200" />
        <span className="text-[14px] font-semibold text-gray-800 dark:text-gray-100">
          {selectedApp.label}
        </span>
        <ChevronDown className="w-4 h-4 ml-auto text-gray-600 dark:text-gray-300" />
      </button>

      {/* Dropdown */}
      {open && pos && mounted &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[4000] rounded-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-ui-navigationDark shadow-md"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            <div className="py-1">
              {APPS.map((app) => {
                const AIcon = app.icon;
                const active = app.key === selected.key;

                return (
                  <button
                    key={app.key}
                    onClick={() => {
                      onSelect?.({ key: app.key, label: app.label });
                      router.push(`/${app.key}`);
                      setOpen(false);
                    }}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2',
                      active
                        ? 'bg-gray-100 dark:bg-[#1f2937]'
                        : 'hover:bg-gray-100 dark:hover:bg-[#1f2937]'
                    )}
                  >
                    <AIcon className="w-4 h-4" />
                    <span className="text-sm">{app.label}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
