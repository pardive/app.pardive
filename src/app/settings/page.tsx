'use client';

import React from 'react';
import SettingsShell from '@/components/layout/SettingsShell';
import SettingsClient from '@/components/settings/SettingsClient';

type TabKey = 'workspace' | 'appearance' | 'sidebar' | 'branding';
type HelpSummary = { title: string; bullets: string[] };

// Map each tab to its in-app help path + human title
const HELP: Record<TabKey, { path: string; title: string }> = {
  workspace:  { path: '/help/settings/workspace',  title: 'Workspace' },
  appearance: { path: '/help/settings/appearance', title: 'Appearance' },
  sidebar:    { path: '/help/settings/sidebar',    title: 'Sidebar' },
  branding:   { path: '/help/settings/branding',   title: 'Branding' },
};

async function fetchSummary(path: string): Promise<HelpSummary> {
  const res = await fetch(`/api/help-summary?path=${encodeURIComponent(path)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('failed');
  return res.json();
}

export default function SettingsPage() {
  const [summary, setSummary] = React.useState<HelpSummary>();
  const [tabsH, setTabsH] = React.useState(48);

  // Default to Workspace on first paint
  React.useEffect(() => {
    void fetchSummary(HELP.workspace.path)
      .then(setSummary)
      .catch(() =>
        setSummary({
          title: HELP.workspace.title,
          bullets: ['Help summary unavailable right now.'],
        })
      );
  }, []);

  // Called by SettingsClient whenever tab changes
  const handleHelpTopicChange = React.useCallback((tabKey: TabKey) => {
    const meta = HELP[tabKey] ?? HELP.workspace;
    void fetchSummary(meta.path)
      .then(setSummary)
      .catch(() =>
        setSummary({
          title: meta.title,
          bullets: ['Help summary unavailable right now.'],
        })
      );
  }, []);

  return (
    <SettingsShell summary={summary} tabsBarHeight={tabsH}>
      <SettingsClient
        onSummaryChange={setSummary}
        onHelpTopicChange={handleHelpTopicChange}
        onTabsBarHeightChange={setTabsH}
      />
    </SettingsShell>
  );
}
