'use client';

import React, {
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
import { LayoutDashboard, Palette, PanelsLeftRight, Badge } from 'lucide-react';

type TabKey = 'workspace' | 'appearance' | 'sidebar' | 'branding';

const WorkspaceTab     = dynamic(() => import('./tabs/WorkspaceTab'),     { ssr: false });
const AppearanceTab    = dynamic(() => import('./tabs/AppearanceTab'),    { ssr: false });
const SidebarModuleTab = dynamic(() => import('./tabs/SidebarModuleTab'), { ssr: false });
const BrandingTab      = dynamic(() => import('./tabs/BrandingTab'),      { ssr: false });

const TABS: { key: TabKey; label: string; Icon: React.ComponentType<any> }[] = [
  { key: 'workspace', label: 'Workspace',   Icon: LayoutDashboard },
  { key: 'appearance', label: 'Appearance', Icon: Palette },
  { key: 'sidebar',    label: 'Sidebar',    Icon: PanelsLeftRight },
  { key: 'branding',   label: 'Branding',   Icon: Badge },
];

// Local fallback summaries (used only if onHelpTopicChange isn’t provided)
const FALLBACK_SUMMARY: Record<TabKey, { title: string; bullets: string[] }> = {
  workspace: {
    title: 'Workspace',
    bullets: [
      'Set workspace name, region & default locale',
      'Invite members and assign roles',
      'Configure tenant domains/subdomains',
      'Best practices for naming conventions',
      'Manage multiple regions and compliance',
      'Connect workspace to integrations',
      'Set default timezones and formats',
      'Troubleshoot login/domain mapping issues',
    ],
  },
  appearance: {
    title: 'Appearance',
    bullets: ['Toggle themes', 'Choose tokens', 'Preview density & spacing'],
  },
  sidebar: {
    title: 'Sidebar',
    bullets: ['Reorder modules', 'Collapse behaviour', 'Role-based visibility'],
  },
  branding: {
    title: 'Branding',
    bullets: ['Upload logos/icons', 'Brand colors & font', 'Header/Footer blocks'],
  },
};

export default function SettingsClient({
  onSummaryChange,
  onHelpTopicChange,           // NEW: tell the page which tab is active for AI summary fetch
  onTabsBarHeightChange,
}: {
  onSummaryChange?: (s: { title: string; bullets: string[] }) => void;
  onHelpTopicChange?: (tabKey: TabKey) => void; // NEW
  onTabsBarHeightChange?: (px: number) => void;
}) {
  const [active, setActive] = useState<TabKey>('workspace');
  const tabsBarRef = useRef<HTMLDivElement>(null);

  // Notify parent about the initial tab on mount (defaults to "workspace")
  useEffect(() => {
    if (onHelpTopicChange) {
      onHelpTopicChange('workspace');
    } else if (onSummaryChange) {
      onSummaryChange(FALLBACK_SUMMARY.workspace);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Measure sticky tabs bar height so the rail partition aligns exactly
  useLayoutEffect(() => {
    if (!tabsBarRef.current || !onTabsBarHeightChange) return;
    const el = tabsBarRef.current;
    const push = () => onTabsBarHeightChange(Math.ceil(el.getBoundingClientRect().height));
    push();
    const ro = new ResizeObserver(() => push());
    ro.observe(el);
    return () => ro.disconnect();
  }, [onTabsBarHeightChange]);

  // Tab switch handler: updates local state + notifies parent
  const handleTabChange = (next: TabKey) => {
    if (next === active) return;
    setActive(next);

    if (onHelpTopicChange) {
      onHelpTopicChange(next);               // parent will fetch AI summary via API
    } else if (onSummaryChange) {
      onSummaryChange(FALLBACK_SUMMARY[next]); // fallback: local static bullets
    }
  };

  return (
    <div className="flex flex-col min-w-0">
      {/* Sticky tabs bar with bottom divider */}
      <div
        ref={tabsBarRef}
        className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
      >
        <div className="flex items-center gap-2 px-4 h-12">
          {TABS.map(({ key, label, Icon }) => {
            const selected = active === key;
            return (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={clsx(
                  'relative inline-flex items-center gap-2 px-4 py-2 text-sm transition',
                  selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={selected ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-4">
        <Suspense fallback={<div className="text-sm text-muted-foreground p-4">Loading…</div>}>
          {active === 'workspace'  && <WorkspaceTab />}
          {active === 'appearance' && <AppearanceTab />}
          {active === 'sidebar'    && <SidebarModuleTab />}
          {active === 'branding'   && <BrandingTab />}
        </Suspense>
      </div>
    </div>
  );
}
