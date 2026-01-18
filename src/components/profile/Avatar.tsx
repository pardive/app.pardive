'use client';

import { Camera } from 'lucide-react';
import { useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

const COLORS = [
  '#0176D3',
  '#2E844A',
  '#BA0517',
  '#5C4C9F',
  '#0B5CAB',
  '#8E030F',
];

function getInitials(first?: string, last?: string, email?: string) {
  if (first || last) {
    return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
  }
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
};

export default function Avatar({
  profile,
  editable = false,
  size = 144,
}: AvatarProps) {
  const supabase = supabaseBrowser();
  const [error, setError] = useState(false);

  const firstName = profile?.first_name;
  const lastName = profile?.last_name;
  const email = profile?.email;

  /* ================= DERIVED ================= */

  const initials = useMemo(
    () => getInitials(firstName, lastName, email),
    [firstName, lastName, email]
  );

  const bgColor = useMemo(
    () => getColor(firstName || lastName || email || 'user'),
    [firstName, lastName, email]
  );

  const avatarUrl = useMemo(() => {
    if (!profile?.avatar_url) return null;

    return supabase.storage
      .from('avatars')
      .getPublicUrl(profile.avatar_url).data.publicUrl;
  }, [profile?.avatar_url, supabase]);

  const showImage =
    typeof avatarUrl === 'string' &&
    avatarUrl.startsWith('http') &&
    !error;

  /* ================= UPLOAD (CACHE-SAFE) ================= */

  const upload = async (file: File) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const ext = file.name.split('.').pop() || 'jpg';
    const version = Date.now();

    // 🔑 CRITICAL: new object path every upload
    const path = `${user.id}/avatar-${version}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, {
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        avatar_url: path,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (dbError) throw dbError;

    // 🔄 keeps rest of app in sync (safe, optional later)
    window.location.reload();
  };

  /* ================= RENDER ================= */

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
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
          style={{
            backgroundColor: bgColor,
            fontSize: Math.floor(size * 0.4),
          }}
        >
          {initials}
        </div>
      )}

      {editable && (
        <label className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-white border shadow flex items-center justify-center cursor-pointer hover:bg-neutral-100">
          <Camera className="w-5 h-5 text-neutral-800" strokeWidth={1.8} />
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => e.target.files && upload(e.target.files[0])}
          />
        </label>
      )}
    </div>
  );
}
