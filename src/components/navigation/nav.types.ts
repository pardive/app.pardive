import type { ComponentType } from 'react';

export type IconType = ComponentType<{ className?: string }>;

export interface NavItem {
  label: string;
  icon: IconType;
  href?: string;
  children?: NavItem[];
}
