// src/config/apps/builder.app.ts
import type { ModuleNode } from '../modules';
import { Route } from 'lucide-react';

export const BuilderApp = {
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
} as const;
