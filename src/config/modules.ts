import type { ComponentType } from 'react';
import {
  LayoutDashboard,
  Layout,
  FileText,
  Bot,
  Users,
  List,
  Filter,
  User,
  Database,
  Table as TableIcon,
  Settings2,
  BarChart3,
} from 'lucide-react';

/* ────────────────────────── Types ────────────────────────── */

export type ModuleLeaf = {
  kind: 'leaf';
  id: string;
  label: string;
  href: string;
  icon?: ComponentType<any>;
  defaultEnabled?: boolean;
};

export type ModuleGroup = {
  kind: 'group';
  id: string;
  label: string;
  icon?: ComponentType<any>;
  href?: string;
  children: ModuleLeaf[];
  defaultEnabled?: boolean;
};

export type ModuleNode = ModuleLeaf | ModuleGroup;
export type ChildItem = ModuleLeaf;

/* ────────────────────── Master Registry ───────────────────── */

export const MODULES: readonly ModuleNode[] = [
  {
    kind: 'leaf',
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    defaultEnabled: true,
  },
  {
    kind: 'leaf',
    id: 'landing-pages',
    label: 'Landing Pages',
    href: '/landing-pages',
    icon: Layout,
    defaultEnabled: true,
  },
  {
    kind: 'leaf',
    id: 'forms',
    label: 'Forms',
    href: '/forms',
    icon: FileText,
    defaultEnabled: true,
  },
  {
    kind: 'leaf',
    id: 'ai-agents',
    label: 'AI Agents',
    href: '/ai-agents',
    icon: Bot,
    defaultEnabled: true,
  },

  /* ---------- Contacts ---------- */
  {
    kind: 'group',
    id: 'contacts',
    label: 'Contacts',
    icon: Users,
    href: '/contact',
    defaultEnabled: true,
    children: [
      {
        kind: 'leaf',
        id: 'all-contacts',
        label: 'All Contacts',
        href: '/contact',
        icon: List,
        defaultEnabled: true,
      },
      {
        kind: 'leaf',
        id: 'contacts-segmentation',
        label: 'Segmentation',
        href: '/contact/segmentation',
        icon: Filter,
        defaultEnabled: true,
      },
      {
        kind: 'leaf',
        id: 'contacts-profiles',
        label: 'Profiles',
        href: '/contact/profiles',
        icon: User,
        defaultEnabled: true,
      },
    ],
  },

  /* ---------- Data ---------- */
  {
    kind: 'group',
    id: 'data',
    label: 'Data',
    icon: Database,
    href: '/data',
    defaultEnabled: true,
    children: [
      {
        kind: 'leaf',
        id: 'data-table',
        label: 'Data Table',
        href: '/data-tables',
        icon: TableIcon,
        defaultEnabled: true,
      },
      {
        kind: 'leaf',
        id: 'table-attributes',
        label: 'Table Attributes',
        href: '/data/table-attributes',
        icon: Settings2,
        defaultEnabled: true,
      },
    ],
  },

  {
    kind: 'leaf',
    id: 'reports',
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
    defaultEnabled: true,
  },
];

/* ─────────────────────── Helpers / Utils ───────────────────── */

export type EnabledMap = Record<string, boolean>;

/* 🔒 Proper type guard (this is the key fix) */
function isModuleNode(value: unknown): value is ModuleNode {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'kind' in value
  );
}

/* ✅ TS-safe normalizer */
function toArray(
  nodes: readonly ModuleNode[] | ModuleNode | null | undefined
): ModuleNode[] {
  if (Array.isArray(nodes)) {
    return [...nodes];
  }

  if (isModuleNode(nodes)) {
    return [nodes];
  }

  return [];
}

export const flattenIds = (nodes: readonly ModuleNode[]): string[] =>
  toArray(nodes).flatMap((n) =>
    n.kind === 'group'
      ? [n.id, ...n.children.map((c) => c.id)]
      : [n.id]
  );

export const computeDefaultMap = (
  nodes: readonly ModuleNode[]
): EnabledMap => {
  const map: EnabledMap = {};

  toArray(nodes).forEach((n) => {
    if (n.kind === 'group') {
      map[n.id] = n.defaultEnabled !== false;
      n.children.forEach(
        (c) => (map[c.id] = c.defaultEnabled !== false)
      );
    } else {
      map[n.id] = n.defaultEnabled !== false;
    }
  });

  return map;
};

export const enabledModules = (
  nodes: readonly ModuleNode[] | ModuleNode | null | undefined,
  enabled: EnabledMap
): ModuleNode[] =>
  toArray(nodes)
    .map((n) => {
      if (n.kind !== 'group') {
        return enabled[n.id] !== false ? n : null;
      }

      const children = n.children.filter(
        (c) => enabled[c.id] !== false
      );

      return enabled[n.id] !== false || children.length
        ? ({ ...n, children } as ModuleGroup)
        : null;
    })
    .filter(Boolean) as ModuleNode[];
