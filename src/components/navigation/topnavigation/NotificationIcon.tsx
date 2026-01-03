// components/navigation/NotificationIcon.tsx
'use client';

import { Bell } from 'lucide-react';
import clsx from 'clsx';

type Props = { className?: string; showDot?: boolean };

export default function NotificationIcon({ className, showDot = true }: Props) {
  return (
    <div className="relative">
      {/* Bell */}
      <Bell
        className={clsx(
          'w-6 h-6 text-[#00332D] dark:text-white origin-top', // pivot at top for nicer swing
          'group-hover:animate-bell-swing',
          className
        )}
        strokeWidth={2}
      />

      {/* Dot (bottom-right) */}
      {showDot && (
        <span
          className={clsx(
            'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full',
            'bg-red-500 ring-2 ring-white dark:ring-ui-navigationDark',
            // idle pop in, then wave on hover
            'animate-dot-pop group-hover:animate-dot-wave'
          )}
        />
      )}
    </div>
  );
}
