'use client';

import { Camera } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function Avatar({
  profile,
  size = 144,
  editable,
}: {
  profile: any;
  size?: number;
  editable?: boolean;
}) {
  const uploadAvatar = async (file: File) => {
    const supabase = supabaseBrowser();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const path = `${user.id}/avatar.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);

    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        avatar_url: data.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (dbError) throw dbError;
  };

  const avatarSrc =
    profile.avatar_url ||
    `https://ui-avatars.com/api/?name=${profile.email}&background=E5E7EB&color=111827`;

  return (
    <div className="relative">
      <img
        src={avatarSrc}
        alt="Avatar"
        className="rounded-full object-cover border bg-white"
        style={{ width: size, height: size }}
      />

      {editable && (
        <>
          <input
            type="file"
            hidden
            id="avatar-upload"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadAvatar(file);
            }}
          />
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-2 right-2 cursor-pointer rounded-full bg-white border shadow p-2"
          >
            <Camera className="w-4 h-4 text-neutral-700" />
          </label>
        </>
      )}
    </div>
  );
}
