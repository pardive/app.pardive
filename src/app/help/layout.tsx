import type { ReactNode } from 'react';
import HelpShell from './HelpShell';

export default function HelpLayout({ children }: { children: ReactNode }) {
  return <HelpShell>{children}</HelpShell>;
}
