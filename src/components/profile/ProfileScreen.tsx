'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Editable from './Editable';
import {
  Camera,
  Users,
  UserPlus,
  MessageSquare,
  AtSign,
  Hash,
  Pencil,
  Check,
} from 'lucide-react';
import clsx from 'clsx';

type Profile = {
  id: string;
  salutation?: string | null;
  gender?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  mobile?: string | null;
  alt_contact?: string | null;
  job_title?: string | null;
  role_internal?: string | null;
  signature?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  followers?: number;
  following?: number;
  is_self?: boolean;
  is_following?: boolean;
};

type Props = {
  userId?: string | null;
};

const SALUTATIONS = [
  { value: 'mr', label: 'Mr' },
  { value: 'ms', label: 'Ms' },
  { value: 'mrs', label: 'Mrs' },
  { value: 'mx', label: 'Mx' },
];

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'na', label: 'Prefer not to say' },
];

function ProfileSkeleton() {
  return (
    <div className="px-6 py-10">
      <div className="animate-pulse h-40 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
      <div className="mt-4 h-24 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
    </div>
  );
}

export default function ProfileScreen({ userId }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPic, setSavingPic] = useState<'avatar' | 'cover' | null>(null);
  const [detailsEditing, setDetailsEditing] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  /* ---------------- load profile ---------------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
        const res = await fetch(`/api/profile${qs}`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`/api/profile ${res.status}`);

        const data = (await res.json()) as { profile: Profile };
        if (!cancelled) setProfile(data.profile);
      } catch {
        if (!cancelled) {
          setProfile({
            id: 'demo',
            first_name: 'Alex',
            last_name: 'Doe',
            email: 'alex@example.com',
            job_title: 'Growth Lead',
            mobile: '+1 555 123 4567',
            signature: 'Best regards,\nAlex',
            salutation: 'mr',
            gender: 'male',
            avatar_url: '',
            cover_url: '',
            followers: 12,
            following: 7,
            is_self: true,
            is_following: false,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const fullName = useMemo(
    () =>
      [profile?.first_name, profile?.last_name]
        .filter(Boolean)
        .join(' ') || 'Unnamed user',
    [profile]
  );

  if (loading || !profile) return <ProfileSkeleton />;

  /* ---------------- SAFE PATCH ---------------- */
  async function patch(field: keyof Profile, val: string) {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        id: prev.id, // keep required field strict
        [field]: val,
      };
    });

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: val }),
      });
      if (!res.ok) throw new Error('PATCH failed');
    } catch {
      // optional rollback / refetch later
    }
  }

  /* ---------------- upload avatar / cover ---------------- */
  async function upload(kind: 'avatar' | 'cover', file: File) {
    const fd = new FormData();
    fd.append('file', file);
    setSavingPic(kind);

    try {
      const res = await fetch(`/api/profile/${kind}`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) throw new Error('upload failed');

      const { url } = (await res.json()) as { url: string };
      void patch(kind === 'avatar' ? 'avatar_url' : 'cover_url', url);
    } finally {
      setSavingPic(null);
    }
  }

  /* JSX BELOW IS UNCHANGED */
  return (
    <div className="pb-16">
      {/* --- rest of your JSX exactly as-is --- */}
    </div>
  );
}
