'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import clsx from 'clsx';

export default function HelpSearchBox({ className }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(() => params.get('q') ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onSlash = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onSlash);
    return () => window.removeEventListener('keydown', onSlash);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = q.trim();
    router.push(v ? `/help/search?q=${encodeURIComponent(v)}` : '/help/search');
  }

  return (
    <form onSubmit={onSubmit} role="search" aria-label="Search help" className={clsx('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search help, docs, cases…  ( / )"
        className={clsx(
          'w-full rounded-lg border bg-white pl-9 pr-3 py-2 text-sm outline-none transition',
          // light
          'border-gray-300 placeholder:text-gray-400 text-gray-900',
          'focus:border-gray-400 focus:ring-2 focus:ring-gray-200',
          // dark
          'dark:border-white/15 dark:bg-[#0F172A] dark:text-gray-100 dark:placeholder:text-gray-400',
          'dark:focus:border-gray-400 dark:focus:ring-gray-400/20'
        )}
      />
    </form>
  );
}
