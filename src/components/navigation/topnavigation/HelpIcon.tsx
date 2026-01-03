'use client';

import { CircleHelp } from 'lucide-react';
import clsx from 'clsx';

type Props = { className?: string };

export default function HelpIcon({ className }: Props) {
  return (
    <div className="relative grid place-items-center group">
      {/* Halo pulse behind the icon */}
      <span
        className={clsx(
          'pointer-events-none absolute inset-0 rounded-full',
          'w-7 h-7', // slightly bigger than the icon
          'bg-[radial-gradient(circle,rgba(0,153,102,0.18),transparent_62%)]',
          'opacity-0 scale-90',
          'group-hover:opacity-100 group-hover:animate-halo-pulse'
        )}
      />
      {/* Icon swivel + pop */}
      <CircleHelp
        className={clsx(
          'w-6 h-6 text-[#00332D] dark:text-white',
          'group-hover:animate-help-swivel-pop',
          className
        )}
        strokeWidth={2}
      />
    </div>
  );
}
