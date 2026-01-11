'use client';

import { Bell } from 'lucide-react';
import clsx from 'clsx';

type Props = { className?: string; showDot?: boolean };

export default function NotificationIcon({ className, showDot = true }: Props) {
  return (
    /* The parent must have 'group' if you want hover to trigger the children */
    <div className="group relative inline-flex items-center justify-center cursor-pointer">
      {/* Bell Icon */}
      <Bell
        className={clsx(
          'w-6 h-6 text-[#00332D] dark:text-white origin-top transition-all duration-300',
          'group-hover:animate-bell-swing', 
          className
        )}
        strokeWidth={2}
      />

      {/* Notification Dot */}
      {showDot && (
        <span
          className={clsx(
            'absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full',
            'bg-red-500 ring-2 ring-white dark:ring-ui-navigationDark',
            /* Initial pop on mount, wave/pulse on hover */
            'animate-dot-pop group-hover:animate-dot-wave'
          )}
        />
      )}
    </div>
  );
}