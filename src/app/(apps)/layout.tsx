'use client';

import AppShell from '@/components/layout/AppShell';

export default function AppsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
