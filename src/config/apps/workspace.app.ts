import {
  Settings,
  Users,
  Shield,
  CreditCard,
  LayoutDashboard,
  Palette,
  UserPlus,
  ShieldCheck,
  Fingerprint,
  FileSearch,
  ReceiptText,
} from 'lucide-react';
import type { ModuleNode } from '../modules';

export const WorkspaceApp = {
  id: 'workspace',
  label: 'Workspace',
  basePath: '/workspace',
  modules: [
    {
      kind: 'group',
      id: 'general',
      label: 'General',
      icon: Settings,
      children: [
        {
          kind: 'leaf',
          id: 'overview',
          label: 'Overview',
          href: '/workspace/overview',
          icon: LayoutDashboard,
        },
        {
          kind: 'leaf',
          id: 'branding',
          label: 'Branding',
          href: '/workspace/branding',
          icon: Palette,
        },
      ],
    },
    {
      kind: 'group',
      id: 'people',
      label: 'People',
      icon: Users,
      children: [
        {
          kind: 'leaf',
          id: 'members',
          label: 'Members',
          href: '/workspace/members',
          icon: UserPlus,
        },
        {
          kind: 'leaf',
          id: 'roles',
          label: 'Roles',
          href: '/workspace/roles',
          icon: ShieldCheck,
        },
      ],
    },
    {
      kind: 'group',
      id: 'security',
      label: 'Security',
      icon: Shield,
      children: [
        {
          kind: 'leaf',
          id: 'authentication',
          label: 'Authentication',
          href: '/workspace/authentication',
          icon: Fingerprint,
        },
        {
          kind: 'leaf',
          id: 'audit-logs',
          label: 'Audit Logs',
          href: '/workspace/audit-logs',
          icon: FileSearch,
        },
      ],
    },
    {
      kind: 'group',
      id: 'billing',
      label: 'Billing',
      icon: CreditCard,
      children: [
        {
          kind: 'leaf',
          id: 'plan',
          label: 'Plan & Usage',
          href: '/workspace/plan',
          icon: ReceiptText,
        },
      ],
    },
  ] satisfies ModuleNode[],
};