'use client';

import {
  Moon,
  Sun,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu as MenuIcon,
} from 'lucide-react';

import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

import { SidebarWrapper } from './index';
import { APPS } from '@/config/apps';
import type { ModuleNode, ModuleGroup } from '@/config/modules';

/* --------------------- Edge handle ------------------- */
function EdgeHandlePortal({
  anchorRef,
  collapsed,
  toggle,
  suppress,
}: {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  collapsed: boolean;
  toggle: () => void;
  suppress?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);
  const [posY, setPosY] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const node = anchorRef.current;
    if (!node) return;

    const update = () => setRect(node.getBoundingClientRect());
    update();

    const ro = new ResizeObserver(update);
    ro.observe(node);

    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchorRef]);

  if (!mounted || !rect) return null;

  const BTN = 20;
  const half = BTN / 2;
  const hoverWidth = 6;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: rect.top,
        left: rect.right - hoverWidth,
        width: hoverWidth,
        height: rect.height,
        zIndex: 1110,
        ...(suppress ? { opacity: 0, pointerEvents: 'none' } : {}),
      }}
      onMouseEnter={() => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setVisible(true);
      }}
      onMouseMove={(e) => {
        const y = e.clientY;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => setPosY(y));
      }}
      onMouseLeave={() => {
        hideTimer.current = window.setTimeout(() => setVisible(false), 120);
      }}
    >
      <button
        type="button"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={toggle}
        className="rounded-full shadow-sm bg-white dark:bg-[#0f172a]"
        style={{
          position: 'absolute',
          top:
            (posY == null
              ? rect.height / 2 - half
              : Math.max(0, Math.min(posY - rect.top - half, rect.height - BTN))),
          left: -half + 4,
          width: BTN,
          height: BTN,
          transform: visible ? 'translateX(0)' : 'translateX(8px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity .12s ease, transform .12s ease',
        }}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 mx-auto" />
        ) : (
          <ChevronLeft className="w-4 h-4 mx-auto" />
        )}
      </button>
    </div>,
    document.body
  );
}

/* --------------------------- Sidebar ------------------------ */
export default function LeftNavigationBar({
  collapsed,
  setCollapsed,
  style,
}: {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const anchorRef = useRef<HTMLDivElement | null>(null);

  const [dark, setDark] = useState(false);

  /* ---------------- Theme ---------------- */
  useEffect(() => {
    const el = document.documentElement;
    const isDark =
      el.classList.contains('dark') ||
      localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    el.classList.toggle('dark', isDark);
    setDark(isDark);
  }, []);

  const toggleTheme = () => {
    const el = document.documentElement;
    const next = !dark;
    el.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setDark(next);
  };

  /* ---------------- App-aware nav ---------------- */
type AppId = keyof typeof APPS;

const appId = pathname.split('/')[1] as AppId | undefined;

const appConfig = appId ? APPS[appId] : undefined;

  const visibleModules: ModuleNode[] = appConfig?.modules ?? [];

  return (
    <>
      <div ref={anchorRef} className="relative h-full" style={style}>
        <SidebarWrapper className="h-full">

          {/* Header */}
          <div
            className={clsx(
              'mt-1 mb-2 flex items-center',
              collapsed ? 'justify-center px-0' : 'justify-between px-4'
            )}
          >
            {!collapsed && (
              <h2 className="text-[22px] font-semibold">Menu</h2>
            )}
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Nav */}
          <div
            className={clsx(
              'flex-1 flex flex-col gap-1 py-2',
              collapsed ? 'items-center px-0' : 'items-stretch px-2'
            )}
          >
            {visibleModules.map((m) => {
              if (m.kind === 'leaf') {
                return (
                  <button
                    key={m.id}
                    onClick={() => router.push(m.href)}
                    className={clsx(
                      'h-10 rounded-md flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]',
                      collapsed ? 'w-10 justify-center' : 'px-3'
                    )}
                  >
                    {m.icon && <m.icon className="w-5 h-5" />}
                    {!collapsed && <span className="text-sm">{m.label}</span>}
                  </button>
                );
              }

              const g = m as ModuleGroup;
              return (
                <div key={g.id} className="mt-2">
                  {!collapsed && (
                    <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">
                      {g.label}
                    </div>
                  )}
                  {g.children.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => router.push(c.href)}
                      className={clsx(
                        'h-9 rounded-md flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]',
                        collapsed ? 'w-10 justify-center' : 'px-3'
                      )}
                    >
                      {c.icon && <c.icon className="w-4 h-4" />}
                      {!collapsed && <span className="text-sm">{c.label}</span>}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {collapsed ? (
            <div className="mt-auto px-2 pb-2 pt-2 flex flex-col items-center gap-1">
              <button
                onClick={toggleTheme}
                className="w-11 h-11 rounded-md grid place-items-center hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
              >
                {dark ? <Sun /> : <Moon />}
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="w-11 h-11 rounded-md grid place-items-center hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
              >
                <Settings />
              </button>
            </div>
          ) : (
            <div className="mt-auto px-2 pb-2 pt-2 flex flex-col gap-1">
              <button
                onClick={toggleTheme}
                className="h-10 px-3 rounded-md flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
              >
                {dark ? <Sun /> : <Moon />}
                <span className="text-sm">
                  {dark ? 'Light' : 'Dark'} Mode
                </span>
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="h-10 px-3 rounded-md flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
              >
                <Settings />
                <span className="text-sm">Settings</span>
              </button>
            </div>
          )}
        </SidebarWrapper>
      </div>

      <EdgeHandlePortal
        anchorRef={anchorRef}
        collapsed={collapsed}
        toggle={() => setCollapsed((c) => !c)}
      />
    </>
  );
}
