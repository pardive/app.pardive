'use client';

import { Camera } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function ProfileCover({
  coverUrl,
  onUploaded,
}: {
  coverUrl?: string;
  onUploaded?: (url: string) => void;
}) {
  const supabase = supabaseBrowser();

  const uploadCover = async (file: File) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const path = `covers/${user.id}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('profile-covers')
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('[COVER_UPLOAD]', uploadError);
      return;
    }

    const { data } = supabase.storage
      .from('profile-covers')
      .getPublicUrl(path);

    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        cover_url: path, // store path, not URL
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (dbError) {
      console.error('[COVER_DB]', dbError);
      return;
    }

    onUploaded?.(path);
  };

  const publicUrl = coverUrl
    ? supabase.storage.from('profile-covers').getPublicUrl(coverUrl).data
        .publicUrl
    : undefined;

  return (
    <div className="relative -mt-6 -mx-8">
      <div
        className="h-60 bg-neutral-900 relative"
        style={{
          backgroundImage: publicUrl ? `url(${publicUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <input
          id="cover-upload"
          type="file"
          hidden
          accept="image/*"
          onChange={(e) =>
            e.target.files && uploadCover(e.target.files[0])
          }
        />

        <label
          htmlFor="cover-upload"
          className="absolute right-6 bottom-4 cursor-pointer text-white/80 hover:text-white"
        >
          <Camera className="w-5 h-5" />
        </label>
      </div>
    </div>
  );
}
