'use client';

import { Camera } from 'lucide-react';
import { useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

const COLORS = ['#0176D3', '#2E844A', '#BA0517', '#5C4C9F', '#0B5CAB', '#8E030F'];

function getInitials(first?: string, last?: string, email?: string) {
  if (first || last) return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
  if (email) return email[0].toUpperCase();
  return '?';
}

function getColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

type AvatarProps = {
  profile?: any;
  editable?: boolean;
  size?: number;
  onClick?: () => void;
};

export default function Avatar({
  profile,
  editable = false,
  size = 144,
  onClick,
}: AvatarProps) {
  const supabase = supabaseBrowser();
  const [error, setError] = useState(false);

  const initials = useMemo(
    () => getInitials(profile?.first_name, profile?.last_name, profile?.email),
    [profile]
  );

  const bgColor = useMemo(
    () => getColor(profile?.first_name || profile?.email || 'user'),
    [profile]
  );

  const avatarUrl = useMemo(() => {
    if (!profile?.avatar_url) return null;
    return supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl;
  }, [profile?.avatar_url, supabase]);

  const showImage = avatarUrl && avatarUrl.startsWith('http') && !error;

  return (
    <div
      role="button"
      tabIndex={0}
      className="relative shrink-0 cursor-pointer focus:outline-none"
      style={{ width: size, height: size }}
      onClick={editable ? onClick : undefined}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          onError={() => setError(true)}
          className="w-full h-full rounded-full object-cover border bg-white"
        />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-white font-medium border"
          style={{ backgroundColor: bgColor, fontSize: Math.floor(size * 0.4) }}
        >
          {initials}
        </div>
      )}

      {editable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // 🔑 prevents parent click
            onClick?.();
          }}
          className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-white border shadow flex items-center justify-center hover:bg-neutral-100"
        >
          <Camera className="w-5 h-5 text-neutral-800" strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}
