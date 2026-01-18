'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { ExternalLink, X } from 'lucide-react';
import Avatar from '@/components/profile/Avatar';

type Props = {
  open: boolean;
  onClose: () => void;

  name?: string;
  jobTitle?: string;
  email?: string;
  mobile?: string;
  avatarUrl?: string;

  profile?: any;
};

export default function ProfileQuickModal({
  open,
  onClose,
  name,
  jobTitle,
  email,
  mobile,
  avatarUrl,
  profile,
}: Props) {
  const derivedProfile =
    profile ??
    {
      first_name: name?.split(' ')[0],
      last_name: name?.split(' ').slice(1).join(' '),
      email,
      job_title: jobTitle,
      mobile,
      avatar_url: avatarUrl,
    };

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
      <div
        className="grid place-items-center min-h-screen p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-[min(94vw,600px)] rounded-lg border border-neutral-200 bg-white shadow-2xl">
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="text-sm font-medium">My profile</div>
            <div className="flex items-center gap-1.5">
              <Link
                href="/profile"
                target="_blank"
                className="grid place-items-center rounded-lg p-2 hover:bg-neutral-200"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                className="grid place-items-center rounded-lg p-2 hover:bg-neutral-200"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* BODY */}
          <div className="p-4">
            <div className="flex items-center gap-4">
              <Avatar profile={derivedProfile} size={100} editable={false} />

              <div className="flex-1 space-y-2 text-[13px]">
                <Field label="Name">
                  {`${derivedProfile.first_name ?? ''} ${derivedProfile.last_name ?? ''}`.trim() || '—'}
                </Field>
                <Field label="Job title">
                  {derivedProfile.job_title || '—'}
                </Field>
                <Field label="Email">
                  {derivedProfile.email || '—'}
                </Field>
                <Field label="Mobile">
                  {derivedProfile.mobile || '—'}
                </Field>
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
      <div className="text-neutral-900">{children}</div>
    </div>
  );
}
