'use client';

import { Camera } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function Avatar({ profile, editable }: any) {
  const supabase = supabaseBrowser();

  const upload = async (file: File) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const path = `${user.id}/avatar.jpg`;

    // 1️⃣ Upload (single canonical path)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) throw uploadError;

    // 2️⃣ Store ONLY path in DB
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        avatar_url: path,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (dbError) throw dbError;

    // 3️⃣ Soft refresh via state (no reload later if you want)
    window.location.reload();
  };

  // ✅ Always derive URL from path
  const avatarUrl = profile.avatar_url
    ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
    : `https://ui-avatars.com/api/?name=${profile.email}`;

  return (
    <div className="relative">
      <img
        src={avatarUrl}
        alt="Avatar"
        className="w-36 h-36 rounded-full border bg-white object-cover"
      />

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
