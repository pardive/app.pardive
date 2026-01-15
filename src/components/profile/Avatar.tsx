'use client';

import { Camera } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function Avatar({
  profile,
  editable,
  size = 144,
}: {
  profile: any;
  editable?: boolean;
  size?: number;
}) {
  const upload = async (file: File) => {
    const supabase = supabaseBrowser();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const path = `${user.id}/avatar.jpg`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);

    await supabase
      .from('profiles')
      .update({
        avatar_url: data.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
  };

  const avatarUrl =
    profile.avatar_url ||
    `https://ui-avatars.com/api/?name=${profile.email}&background=E5E7EB&color=111827`;

  return (
    <div className="relative">
      {/* Avatar image */}
      <img
        src={avatarUrl}
        alt="Avatar"
        className="rounded-full object-cover border bg-white"
        style={{ width: size, height: size }}
      />

      {/* Camera icon */}
      {editable && (
  <label
    title="Change photo"
    className="
      absolute bottom-1 right-1
      w-10 h-10
      rounded-full
      bg-white
      border
      shadow-md
      flex items-center justify-center
      cursor-pointer
      hover:bg-neutral-100
      transition
    "
  >
    <Camera
      className="w-5 h-5 text-neutral-800"
      strokeWidth={1.8}
    />

    <input
      type="file"
      hidden
      accept="image/*"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) upload(file);
      }}
    />
  </label>
)}
    </div>
  );
}
