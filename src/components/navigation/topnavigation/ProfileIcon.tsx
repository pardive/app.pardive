'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { User, LogOut, Settings, IdCard, ExternalLink } from 'lucide-react';

import ProfileQuickModal from '@/components/profile/ProfileQuickModal';
import { useProfile } from '@/hooks/useProfile';

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

  /* ---------------- data ---------------- */
  const { profile } = useProfile() as { profile: Profile | null };

  /* ---------------- popover ---------------- */
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const hoverCloseId = useRef<number | null>(null);

  /* ---------------- modal ---------------- */
  const [modalOpen, setModalOpen] = useState(false);

  /* ---------------- styles ---------------- */
  const MENU_ITEM =
    'rounded-lg px-3 py-2 text-sm leading-5 hover:bg-neutral-200 dark:hover:bg-neutral-700';

  const HEADER =
    'rounded-t-lg -m-1 mb-1 px-3 py-2.5 text-[11px] uppercase tracking-wider font-semibold ' +
    'text-neutral-500 bg-neutral-50/90 dark:bg-neutral-800/70 border-b border-neutral-200/80 dark:border-neutral-800';

  /* ---------------- positioning ---------------- */
  const positionMenu = () => {
    const r = anchorRef.current?.getBoundingClientRect();
    if (!r) return;

    const width = 224;
    const gap = 8;

    setMenuPos({
      top: Math.round(r.bottom + gap),
      left: Math.round(
        Math.min(window.innerWidth - width - gap, Math.max(gap, r.right - width))
      ),
    });
  };

  const openMenu = () => {
    positionMenu();
    setMenuOpen(true);
  };

  const closeMenu = () => setMenuOpen(false);

  /* ---------------- hover logic ---------------- */
  const onAnchorEnter = () => {
    if (hoverCloseId.current) clearTimeout(hoverCloseId.current);
    openMenu();
  };

  const onAnchorLeave = () => {
    hoverCloseId.current = window.setTimeout(closeMenu, 120);
  };

  const onMenuEnter = () => {
    if (hoverCloseId.current) clearTimeout(hoverCloseId.current);
  };

  const onMenuLeave = () => {
    hoverCloseId.current = window.setTimeout(closeMenu, 120);
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

      if (
        anchorRef.current?.contains(t) ||
        document.getElementById('profile-popover')?.contains(t)
      ) {
        return;
      }

      closeMenu();
    };

    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  /* ---------------- actions ---------------- */
  const openProfileModal = () => {
    setModalOpen(true);
    closeMenu();
  };

  if (!profile) return null;

  return (
    <>
      {/* Anchor */}
      <div
        ref={anchorRef}
        className="relative grid place-items-center"
        onMouseEnter={onAnchorEnter}
        onMouseLeave={onAnchorLeave}
      >
        <button
          type="button"
          aria-label="Account"
          onClick={() => (menuOpen ? closeMenu() : openMenu())}
          className="grid place-items-center"
        >
          <User
            className={clsx(
              'w-6 h-6 text-[#00332D] dark:text-white cursor-pointer',
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
          top: menuPos.top,
          left: menuPos.left,
          zIndex: 1_000_000,
        }}
        className={clsx(
          'w-56 rounded-lg border bg-white/95 backdrop-blur shadow-xl p-1',
          'dark:bg-neutral-900/95 dark:border-neutral-800',
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className={HEADER}>Account</div>

        <div className="flex items-stretch gap-1">
          <button
            onClick={openProfileModal}
            className={`flex-1 inline-flex items-center gap-2 ${MENU_ITEM}`}
          >
            <IdCard className="w-4 h-4" />
            My profile
          </button>

          <Link
            href="/profile"
            target="_blank"
            rel="noopener noreferrer"
            className="grid place-items-center rounded-lg px-2 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        <Link href="/preferences" className={`flex items-center gap-2 ${MENU_ITEM}`}>
          <Settings className="w-4 h-4" />
          Preferences
        </Link>

        <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />

        <button
          onClick={() => (window.location.href = '/')}
          className={`w-full text-left flex items-center gap-2 ${MENU_ITEM}`}
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>

      {/* Profile modal */}
      <ProfileQuickModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        name={
          `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || '—'
        }
        jobTitle={profile.job_title ?? undefined}
        email={profile.email ?? undefined}
        mobile={profile.mobile ?? undefined}
        avatarUrl={profile.avatar_url ?? undefined}
      />
    </>
  );
}
