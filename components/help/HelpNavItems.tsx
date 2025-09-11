'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const ITEMS = [
  { label: 'My Cases',       href: '/help/cases' },
  { label: 'Ideas',          href: '/help/ideas' },
  { label: 'Learnings',      href: '/help/learnings' },
  { label: 'Documentations', href: '/help' }, // root help page
];

export default function HelpNavItems() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/help') {
      const others = ITEMS.filter(i => i.href !== '/help').map(i => i.href);
      return pathname.startsWith('/help') && !others.some(p => pathname.startsWith(p));
    }
    return pathname.startsWith(href);
  };

  return (
    <nav aria-label="Help primary navigation">
      <ul className="flex items-center gap-6">
        {ITEMS.map(item => (
          <li key={item.href} className="relative">
            <Link
              href={item.href}
              className={clsx(
                'text-sm font-medium transition-colors py-1.5',
                'text-gray-700 hover:text-gray-900',
                'dark:text-gray-300 dark:hover:text-white',
                'relative after:absolute after:left-0 after:-bottom-2 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:transition-transform',
                'after:bg-current',
                isActive(item.href) ? 'text-black dark:text-white after:scale-x-100' : 'after:scale-x-0'
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
