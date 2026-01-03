'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { ReactNode } from 'react';
import clsx from 'clsx';

export default function Tooltip({
  label,
  children,
  side = 'right',
}: { label: string; children: ReactNode; side?: 'top'|'right'|'bottom'|'left' }) {
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content
          side={side}
          className={clsx(
            'rounded-md bg-gray-900 text-white text-xs px-2 py-1 shadow-lg z-50'
          )}
        >
          {label}
          <TooltipPrimitive.Arrow className="fill-gray-900" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
