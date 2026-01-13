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

  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src={profile.avatar_url
          ? supabaseBrowser()
              .storage.from('avatars')
              .getPublicUrl(profile.avatar_url).data.publicUrl
          : `https://ui-avatars.com/api/?name=${profile.email}`}
        className="w-36 h-36 rounded-full border"
      />

      {editable && (
        <label className="text-sm cursor-pointer text-blue-600">
          Upload photo
          <input
            type="file"
            hidden
            onChange={(e) => e.target.files && upload(e.target.files[0])}
          />
        </label>
      )}
    </div>
  );
}
