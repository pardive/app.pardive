'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import HelpNavItems from './HelpNavItems';
import ProfileIcon from '@/components/navigation/topnavigation/ProfileIcon';
import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

type Props = {
  offset?: number;            // height of any fixed header above
  profileHref?: string;       // route to profile page
};

export default function HelpNavbar({ offset = 0, profileHref = '/profile' }: Props) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const inPlaceRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [barH, setBarH] = useState(56);

  // measure normal bar height (for spacer when fixed)
  useEffect(() => {
    const node = inPlaceRef.current;
    if (!node) return;
    const ro = new ResizeObserver(() => setBarH(node.offsetHeight || 56));
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  // toggle sticky using an IntersectionObserver on the anchor
  useEffect(() => {
    const node = anchorRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { rootMargin: `-${offset}px 0px 0px 0px`, threshold: 0 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [offset]);

  useLayoutEffect(() => setMounted(true), []);

  // shared inner layout; controls Saltify icon + ProfileIcon via flags
  const Inner = ({ showSaltifyIcon, showProfileIcon }: { showSaltifyIcon: boolean; showProfileIcon: boolean }) => (
    <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 gap-6">
      {/* Left: Saltify icon (optional) + Help + nav items */}
      <div className="flex items-center gap-6 md:gap-8 min-w-0">
        <Link href="/help" className="flex items-center gap-2 shrink-0" aria-label="Saltify Help Home">
          {showSaltifyIcon && (
            <>
              <Image
                src="/logo/saltify-icon/1.svg"
                alt="Saltify"
                width={24}
                height={24}
                className="block dark:hidden"
                priority
              />
              <Image
                src="/logo/saltify-icon/1.svg"
                alt="Saltify"
                width={24}
                height={24}
                className="hidden dark:block"
                priority
              />
            </>
          )}
          <span className="text-2xl font-extrabold tracking-tight whitespace-nowrap">Help</span>
        </Link>

        <HelpNavItems className="px-2" />
      </div>

      {/* Right: search + (sticky-only) profile icon */}
      <div className="hidden md:flex items-center gap-3">
        <div className="relative w-[520px] max-w-[60vw]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search help, docs, cases…  (/)"
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm outline-none border-border focus:ring-2 focus:ring-muted/40"
            aria-label="Search help"
          />
        </div>

        {showProfileIcon && (
          <Link
            href={profileHref}
            aria-label="Open profile"
            className="shrink-0 inline-flex items-center justify-center"
          >
            <ProfileIcon />
          </Link>
        )}
      </div>
    </div>
  );

  const FixedBar = (
    <header
      className="fixed inset-x-0 z-50 border-b border-border bg-background shadow-sm"
      style={{ top: offset }}
    >
      <Inner showSaltifyIcon={true} showProfileIcon={true} />
    </header>
  );

  return (
    <>
      <div ref={anchorRef} aria-hidden="true" />
      {/* Normal (not stuck): solid, no Saltify icon, no Profile icon */}
      {!stuck && (
        <header
          ref={inPlaceRef}
          className="relative w-full border-b border-border bg-background"
        >
          <Inner showSaltifyIcon={false} showProfileIcon={false} />
        </header>
      )}

      {/* Stuck: add spacer and portal a fixed bar with icons */}
      {stuck && (
        <>
          <div style={{ height: barH }} aria-hidden="true" />
          {mounted ? createPortal(FixedBar, document.body) : null}
        </>
      )}
    </>
  );
}
