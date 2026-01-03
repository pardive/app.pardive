import {
  LayoutTemplate,
  FileText,
  Bot,
  Database,
  Users,
  BarChart,
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import type { NavItem } from './nav.types';

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Landing Pages', icon: LayoutTemplate, href: '/landingpages' },
  { label: 'Forms', icon: FileText, href: '/forms' },
  { label: 'AI Agents', icon: Bot, href: '/aiagents' },
  {
    label: 'Data Extensions',
    icon: Database,
    href: '/dataextensions',
    children: [
      { label: 'All Data Extensions', icon: Database, href: '/dataextensions' },
      { label: 'My Data Extensions', icon: Database, href: '/dataextensions/mine' },
      { label: 'Analyze Data', icon: BarChart, href: '/dataextensions/analyze' },
    ],
  },
  { label: 'Contacts', icon: Users, href: '/contacts' },
  { label: 'Reports', icon: BarChart, href: '/reports' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];
