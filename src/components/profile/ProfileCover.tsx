'use client';

import { Camera } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function ProfileCover({
  coverUrl,
  onUploaded,
}: {
  coverUrl?: string;
  onUploaded: (url: string) => void;
}) {
  const upload = async (file: File) => {
    const supabase = supabaseBrowser();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const path = `${user.id}.jpg`;

    const { error } = await supabase.storage
      .from('profile-covers')
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage
      .from('profile-covers')
      .getPublicUrl(path);

    await supabase
      .from('profiles')
      .update({
        cover_url: data.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    onUploaded(data.publicUrl);
  };

  return (
    /* 🔑 RESTORED FULL-BLEED ALIGNMENT */
    <div className="relative -mt-6 -mx-8">
      <div
        className="h-60 relative bg-neutral-800"
        style={{
          backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <input
          type="file"
          hidden
          id="cover-upload"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
        />

        <label
          htmlFor="cover-upload"
          className="
            absolute right-6 bottom-4
            cursor-pointer
            text-white/80 hover:text-white
          "
          title="Change cover"
        >
          <Camera className="w-5 h-5" />
        </label>
      </div>
    </div>
  );
}
