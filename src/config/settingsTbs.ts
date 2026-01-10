// src/config/settingsTabs.ts

export type TabKey = 'workspace' | 'appearance' | 'sidebar' | 'branding';

export const HELP: Record<TabKey, { path: string; title: string }> = {
  workspace:  { path: '/help/settings/workspace',  title: 'Workspace' },
  appearance: { path: '/help/settings/appearance', title: 'Appearance' },
  sidebar:    { path: '/help/settings/sidebar',    title: 'Sidebar' },
  branding:   { path: '/help/settings/branding',   title: 'Branding' },
};

export const SETTINGS_TABS = [
  {
    id: 'identity-rules',
    label: 'Identity Rules',
    href: '/settings/data/identity-rules',
  },
];
