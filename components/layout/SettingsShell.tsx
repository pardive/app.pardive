'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import clsx from 'clsx';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import LeftNavigationBar from '@/components/navigation/sidebar/LeftNavigationBar';
import TopNavigationBar from '@/components/navigation/topnavigation/TopNavigationBar';

import {
  SIDEBAR_EXPANDED,
  SIDEBAR_COLLAPSED,
  HEADER_HEIGHT,
  GRID_GAP,
} from '@/lib/ui/constants';

import HelpPanel from '@/components/settings/HelpPanel';
import AltmanChat from '@/components/settings/AltmanChat';

const PERSIST_KEY = 'saltify-stick-collapsed';
const HELP_VIS_KEY = 'saltify-help-visible';

const PARTITION_OFFSET = 14;

export default function SettingsShell({
  children,
  summary,
  tabsBarHeight = 58,
}: {
  children: React.ReactNode;
  summary?: { title: string; bullets: string[] };
  tabsBarHeight?: number;
}) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem(PERSIST_KEY) === '1'; } catch { return false; }
  });

  const [helpVisible, setHelpVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const v = localStorage.getItem(HELP_VIS_KEY);
      return v === null ? true : v === '1';
    } catch { return true; }
  });

  const pathname = usePathname();

  useEffect(() => {
    try { collapsed ? localStorage.setItem(PERSIST_KEY, '1') : localStorage.removeItem(PERSIST_KEY); } catch {}
  }, [collapsed]);

  useEffect(() => {
    try { localStorage.setItem(HELP_VIS_KEY, helpVisible ? '1' : '0'); } catch {}
  }, [helpVisible]);

  useLayoutEffect(() => {
    try { if (localStorage.getItem(PERSIST_KEY) === '1') setCollapsed(true); } catch {}
  }, []);
  useLayoutEffect(() => {
    try { if (localStorage.getItem(PERSIST_KEY) === '1') setCollapsed(true); } catch {}
  }, [pathname]);

  const safeHeader =
    typeof HEADER_HEIGHT === 'number' ? `${HEADER_HEIGHT}px` : HEADER_HEIGHT || '64px';
  const safeGap =
    typeof GRID_GAP === 'number' ? `${GRID_GAP}px` : GRID_GAP || '8px';

  // LEFT column responds to collapse
  const leftWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  const safeLeft =
    typeof leftWidth === 'number' ? `${leftWidth}px` : leftWidth || '220px';

  // RIGHT rail should NOT collapse — keep it fixed at expanded width
  const rightWidth = SIDEBAR_EXPANDED;
  const safeRight =
    typeof rightWidth === 'number' ? `${rightWidth}px` : rightWidth || '220px';

  const gridCols = helpVisible ? `${safeLeft} 1fr ${safeRight}` : `${safeLeft} 1fr`;

  const helpUrl = useMemo(() => {
    const raw = (summary?.title || 'settings').toLowerCase();
    return `https://help.saltifysaas.com/settings/${encodeURIComponent(raw)}`;
  }, [summary?.title]);

  return (
    <div className="h-screen bg-gray-200 dark:bg-ui-appBgDark p-2">
      <div
        className="grid h-full"
        style={{
          gridTemplateColumns: gridCols,
          gridTemplateRows: `${safeHeader} minmax(0, 1fr)`,
          gap: safeGap,
          transition: 'grid-template-columns .2s ease',
        }}
      >
        {/* Brand (row 1, col 1) */}
        <div className="rounded-md bg-[#00332D] grid place-items-center overflow-hidden h-full box-border" aria-label="Brand">
          <Image
            src={collapsed ? '/logo/saltify-icon-trans/2.svg' : '/logo/logo-white.svg'}
            alt="Saltify"
            width={collapsed ? 28 : 120}
            height={28}
            className="object-contain"
            priority
          />
        </div>

        {/* Top nav (row 1, col 2) — span 2 when help is visible */}
        <div
          className={clsx(
            'rounded-md overflow-hidden h-full box-border bg-white dark:bg-ui-pageDark shadow-sm',
            helpVisible ? 'col-span-2' : 'col-span-1'
          )}
        >
          <TopNavigationBar />
        </div>

        {/* Sidebar (row 2, col 1) */}
        <div className="rounded-md overflow-hidden h-full">
          <LeftNavigationBar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* MAIN (row 2, col 2) */}
        <main
          className={clsx(
            'bg-white dark:bg-ui-pageDark rounded-md h-full min-h-0',
            'shadow-sm overflow-auto relative'
          )}
        >
          {!helpVisible && (
            <button
              onClick={() => setHelpVisible(true)}
              className="absolute z-30 rounded-l-md rounded-r-none border px-3 py-1 text-xs
                         bg-white dark:bg-ui-pageDark shadow hover:bg-gray-50 dark:hover:bg-ui-appBgDark/60"
              style={{ top: 18, right: -8 }}
              aria-label="Show help"
              title="Show help"
            >
              « Help
            </button>
          )}

          <div className="p-4">
            {children}
          </div>
        </main>

        {/* RIGHT RAIL (row 2, col 3) — fixed width, never collapses */}
        {helpVisible && (
          <aside
            className={clsx(
              'bg-white dark:bg-ui-pageDark rounded-md p-0 h-full min-h-0',
              'shadow-sm flex flex-col relative overflow-visible'
            )}
            style={{ width: safeRight }}
          >
            {/* Horizontal partition only */}
            <div
              className="absolute left-0 right-0 bg-foreground/10"
              style={{ top: tabsBarHeight + PARTITION_OFFSET, height: 1 }}
              aria-hidden
            />

            {/* External link */}
            <Link
              href={helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in new page"
              title="Open in new page"
              className="absolute z-30 rounded-md border px-2 py-1 text-xs
                         bg-white dark:bg-ui-pageDark shadow hover:bg-gray-50 dark:hover:bg-ui-appBgDark/60
                         flex items-center gap-1"
              style={{ top: 18, right: 64 }}
            >
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Open in new page</span>
            </Link>

            {/* Hide */}
            <button
              onClick={() => setHelpVisible(false)}
              className="absolute z-30 rounded-l-md border px-3 py-1 text-xs
                         bg-white dark:bg-ui-pageDark shadow hover:bg-gray-50 dark:hover:bg-ui-appBgDark/60"
              style={{ top: 18, right: 0 }}
              aria-label="Hide help"
              title="Hide help"
            >
              Hide »
            </button>

            {/* Help content */}
            <div className="flex-1 min-h-0">
              <HelpPanel summary={summary} tabsBarHeight={tabsBarHeight + PARTITION_OFFSET} />
            </div>
          </aside>
        )}
      </div>

      {/* Floating chat */}
      <AltmanChat activeTab="settings" />
    </div>
  );
}
