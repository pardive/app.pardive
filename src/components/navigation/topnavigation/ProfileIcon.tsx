'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { User, LogOut, Settings, IdCard, ExternalLink } from 'lucide-react';
import ProfileQuickModal from '@/components/profile/ProfileQuickModal';

type Props = { className?: string };

type Profile = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  mobile?: string | null;
  job_title?: string | null;
  avatar_url?: string | null;
};

export default function ProfileIcon({ className }: Props) {
  const anchorRef = useRef<HTMLDivElement | null>(null);

  /* ---------------- popover ---------------- */
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const hoverCloseId = useRef<number | null>(null);

  /* ---------------- modal + profile ---------------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  /* ---------------- shared styles ---------------- */
  const MENU_ITEM_TEXT = 'text-sm leading-5';
  const MENU_ITEM_PAD = 'px-3 py-2';
  const MENU_ITEM_BASE =
    'rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 ' +
    MENU_ITEM_TEXT +
    ' ' +
    MENU_ITEM_PAD;

  const HEADER_CLS =
    'rounded-t-lg -m-1 mb-1 px-3 py-2.5 text-[11px] uppercase tracking-wider ' +
    'font-semibold text-neutral-500 bg-neutral-50/90 dark:bg-neutral-800/70 ' +
    'border-b border-neutral-200/80 dark:border-neutral-800';

  /* ---------------- positioning ---------------- */
  const positionMenu = () => {
    const r = anchorRef.current?.getBoundingClientRect();
    if (!r) return;

    const width = 224; // w-56
    const gap = 8;

    const top = Math.round(r.bottom + gap);
    const left = Math.round(
      Math.min(window.innerWidth - width - gap, Math.max(gap, r.right - width))
    );

    setMenuPos({ top, left });
  };

  const openMenu = () => {
    positionMenu();
    setMenuOpen(true);
  };

  const closeMenu = () => setMenuOpen(false);

  const onAnchorEnter = () => {
    if (hoverCloseId.current) window.clearTimeout(hoverCloseId.current);
    openMenu();
  };

  const onAnchorLeave = () => {
    hoverCloseId.current = window.setTimeout(() => setMenuOpen(false), 120);
  };

  const onMenuEnter = () => {
    if (hoverCloseId.current) window.clearTimeout(hoverCloseId.current);
  };

  const onMenuLeave = () => {
    hoverCloseId.current = window.setTimeout(() => setMenuOpen(false), 120);
  };

  /* ---------------- effects ---------------- */
  useEffect(() => {
    if (!menuOpen) return;

    const onScroll = () => positionMenu();
    const onResize = () => positionMenu();

    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuOpen) return;

      const t = e.target as Node;
      const a = anchorRef.current;
      const m = document.getElementById('profile-popover');

      if (a?.contains(t) || m?.contains(t)) return;
      closeMenu();
    };

    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  /* ---------------- modal open + fetch ---------------- */
  const openProfileModal = () => {
    setModalOpen(true);
    closeMenu();

    if (profile || loadingProfile) return;

    setLoadingProfile(true);
    fetch('/api/profile', { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: { profile: Profile }) => setProfile(j.profile))
      .catch(() =>
        setProfile({
          id: 'me',
          first_name: 'Alex',
          last_name: 'Doe',
          email: 'alex@example.com',
          mobile: '+1 555 123 4567',
          job_title: 'Growth Lead',
          avatar_url: '',
        })
      )
      .finally(() => setLoadingProfile(false));
  };

  return (
    <>
      {/* Anchor */}
      <div
        ref={anchorRef}
        className="relative grid place-items-center group"
        onMouseEnter={onAnchorEnter}
        onMouseLeave={onAnchorLeave}
      >
        <button
          type="button"
          aria-label="Account"
          title="Account"
          onClick={() => (menuOpen ? closeMenu() : openMenu())}
          className="grid place-items-center"
        >
          <User
            className={clsx(
              'w-6 h-6 text-[#00332D] dark:text-white',
              'origin-center group-hover:animate-profile-swivel',
              'cursor-pointer',
              className
            )}
            strokeWidth={2.2}
          />
        </button>
      </div>

      {/* Popover */}
      <div
        id="profile-popover"
        onMouseEnter={onMenuEnter}
        onMouseLeave={onMenuLeave}
        style={{
          position: 'fixed',
          top: `${menuPos.top}px`,
          left: `${menuPos.left}px`,
          zIndex: 1_000_000,
        }}
        className={clsx(
          'w-56 rounded-lg border bg-white/95 backdrop-blur shadow-xl',
          'dark:bg-neutral-900/95 dark:border-neutral-800',
          'transition-opacity duration-150 p-1',
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* HEADER */}
        <div className={HEADER_CLS}>ACCOUNT</div>

        {/* My profile */}
        <div className="flex items-stretch gap-1">
          <button
            type="button"
            onClick={openProfileModal}
            className={clsx('flex-1 inline-flex items-center gap-2', MENU_ITEM_BASE)}
          >
            <IdCard className="w-4 h-4" />
            <span className="text-left">My profile</span>
          </button>

          <Link
            href="/profile"
            title="Open full page"
            target="_blank"
            rel="noopener noreferrer"
            className={clsx('grid place-items-center rounded-lg', MENU_ITEM_PAD)}
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        <MenuItem href="/preferences" icon={<Settings className="w-4 h-4" />}>
          Preferences
        </MenuItem>

        <MenuDivider />

        <button
          onClick={() => (window.location.href = '/')}
          className={clsx('w-full text-left flex items-center gap-2', MENU_ITEM_BASE)}
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>

      {/* Quick Profile modal */}
      <ProfileQuickModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        name={
          profile
            ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || '—'
            : undefined
        }
        jobTitle={profile?.job_title ?? undefined}
        email={profile?.email ?? undefined}
        mobile={profile?.mobile ?? undefined}
        avatarUrl={profile?.avatar_url ?? undefined}
      />
    </>
  );
}

/* ---------------- helpers ---------------- */

function MenuItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 px-3 py-2 text-sm leading-5"
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {children}
      </span>
    </Link>
  );
}

function MenuDivider() {
  return <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />;
}
