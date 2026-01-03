// src/config/apps.ts
import type { ModuleNode } from './modules';
import { Route } from 'lucide-react';

export const APPS = {
  builder: {
    id: 'builder',
    label: 'Builder',
    basePath: '/builder',
    modules: [
      {
        kind: 'leaf',
        id: 'router',
        label: 'Router',
        href: '/builder/router',
        icon: Route,
      },
    ] satisfies ModuleNode[],
  },

  marketing: {
    id: 'marketing',
    label: 'Marketing',
    basePath: '/marketing',
    modules: [
      {
        kind: 'leaf',
        id: 'campaigns',
        label: 'Campaigns',
        href: '/marketing/campaigns',
      },
    ] satisfies ModuleNode[],
  },
};
