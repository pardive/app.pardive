'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { ExternalLink, X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  name?: string;
  jobTitle?: string;
  email?: string;
  mobile?: string;
  avatarUrl?: string;
};

export default function ProfileQuickModal({
  open,
  onClose,
  name,
  jobTitle,
  email,
  mobile,
  avatarUrl,
}: Props) {
  return (
    <div
      className={clsx(
        'fixed inset-0 z-[100000] bg-black/40 backdrop-blur-sm transition-opacity',
        open ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {/* perfect centering via grid */}
      <div className="grid place-items-center min-h-screen p-3" onClick={(e) => e.stopPropagation()}>
        <div
          className="
            w-[min(94vw,600px)]        /* <= tighter max width */
            max-h-[85vh] overflow-auto
            rounded-lg border border-neutral-200 dark:border-neutral-800
            bg-white dark:bg-neutral-900 shadow-2xl
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="text-sm font-medium">My profile</div>
            <div className="flex items-center gap-1.5">
                    <Link
                    href="/profile"
                    title="Open full page"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid place-items-center rounded-lg p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    >
                    <ExternalLink className="w-4 h-4" />
                    </Link>

              <button
                type="button"
                aria-label="Close"
                className="grid place-items-center rounded-lg p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 md:p-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    avatarUrl ||
                    `https://api.dicebear.com/8.x/shapes/svg?seed=${encodeURIComponent(name || 'user')}`
                  }
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-2 text-[13px]">
                <Field label="Name">{name || '—'}</Field>
                <Field label="Job title">{jobTitle || '—'}</Field>
                <Field label="Email">{email || '—'}</Field>
                <Field label="Mobile">{mobile || '—'}</Field>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 text-neutral-500">{label}</div>
      <div className="text-neutral-900 dark:text-neutral-100">{children}</div>
    </div>
  );
}
