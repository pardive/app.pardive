'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

import LeftNavigationBar from '@/components/navigation/sidebar/LeftNavigationBar';
import TopNavigationBar from '@/components/navigation/topnavigation/TopNavigationBar';

import {
  SIDEBAR_EXPANDED,
  SIDEBAR_COLLAPSED,
  GRID_GAP,
} from '@/lib/ui/constants';

const PERSIST_KEY = 'saltify-stick-collapsed';
const FIXED_HEADER_HEIGHT = 54;

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  /* ---------------- Sidebar collapse state ---------------- */
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(PERSIST_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (collapsed) localStorage.setItem(PERSIST_KEY, '1');
      else localStorage.removeItem(PERSIST_KEY);
    } catch {}
  }, [collapsed]);

  useLayoutEffect(() => {
    try {
      if (localStorage.getItem(PERSIST_KEY) === '1') setCollapsed(true);
    } catch {}
  }, []);

  useLayoutEffect(() => {
    try {
      if (localStorage.getItem(PERSIST_KEY) === '1') setCollapsed(true);
    } catch {}
  }, [pathname]);

  /* ---------------- URL is the ONLY source of truth ---------------- */
  const appId = pathname.split('/')[1] || 'builder';

  const selectedApp = {
    key: appId,
    label: appId.charAt(0).toUpperCase() + appId.slice(1),
  };

  /* ---------------- Layout math ---------------- */
  const safeHeader = `${FIXED_HEADER_HEIGHT}px`;
  const safeGap =
    typeof GRID_GAP === 'number' ? `${GRID_GAP}px` : GRID_GAP || '8px';

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  const safeSidebar =
    typeof sidebarWidth === 'number'
      ? `${sidebarWidth}px`
      : sidebarWidth || '220px';

  return (
    <div className="h-screen bg-gray-200 dark:bg-ui-appBgDark">
      <div
        className="grid h-full"
        style={{
          gridTemplateColumns: `${safeSidebar} 1fr`,
          gridTemplateRows: `${safeHeader} minmax(0, 1fr)`,
          gap: safeGap,
          rowGap: safeGap,
          transition: 'grid-template-columns .2s ease',
        }}
      >
        {/* ---------------- TOP NAV ---------------- */}
        <div className="h-full max-w-full box-border bg-white dark:bg-ui-pageDark shadow-sm col-span-2">
          <TopNavigationBar
            collapsed={collapsed}
            selectedApp={selectedApp}
          />
        </div>

        {/* ---------------- SIDEBAR ---------------- */}
        <div className="overflow-hidden h-full rounded-tr-md">
          <LeftNavigationBar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* ---------------- CONTENT ---------------- */}
        <main className="bg-white dark:bg-ui-pageDark rounded-tl-md p-4 h-full min-h-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
