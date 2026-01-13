'use client';

import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function Avatar({ profile, editable }: any) {
  const upload = async (file: File) => {
    const supabase = supabaseBrowser();

    const path = `avatars/${profile.id}.png`;

    await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    await fetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({
        avatar_url: path,
      }),
    });

    location.reload();
  };

  const avatarUrl = profile.avatar_url
    ? supabaseBrowser()
        .storage
        .from('avatars')
        .getPublicUrl(profile.avatar_url).data.publicUrl
    : `https://ui-avatars.com/api/?name=${profile.email}&background=E5E7EB&color=111827`;

  return (
    <div className="relative">
      {/* Avatar */}
      <img
        src={avatarUrl}
        alt="Avatar"
        className="w-36 h-36 rounded-full border bg-white object-cover"
      />

      {/* Camera icon (only if editable) */}
      {editable && (
        <label
          className="
            absolute bottom-1 right-1
            w-9 h-9 rounded-full
            bg-white border shadow
            flex items-center justify-center
            cursor-pointer
            hover:bg-neutral-100
          "
          title="Change photo"
        >
          {/* Camera SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-neutral-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7h3l2-3h8l2 3h3v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
            />
            <circle cx="12" cy="13" r="3" />
          </svg>

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
