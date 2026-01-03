'use client';

import { cn } from '@/lib/utils';

export default function PageScaffold({
  header,
  children,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Header strip */}
      <div
        className="
          shrink-0
          bg-gray-50 border-b border-gray-200
          dark:bg-ui-navigationDark dark:border-ui-borderDark
        "
      >
        {header}
      </div>

      {/* Main canvas */}
      <div
        className="
          flex-1 overflow-hidden
          bg-white
          dark:bg-[#1f1f1f]
        "
      >
        {children}
      </div>
    </div>
  );
}
