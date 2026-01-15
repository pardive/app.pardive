'use client';

import { Camera } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function ProfileCover({
  coverUrl,
  editable,
  onUploaded,
}: {
  coverUrl?: string;
  editable?: boolean;
  onUploaded?: (url: string) => void;
}) {
  const uploadCover = async (file: File) => {
    const supabase = supabaseBrowser();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const path = `${user.id}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('profile-covers')
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('profile-covers')
      .getPublicUrl(path);

    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        cover_url: data.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (dbError) throw dbError;

    onUploaded?.(data.publicUrl);
  };

  return (
    <div className="relative h-60 bg-neutral-800">
      {coverUrl && (
        <img
          src={coverUrl}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {editable && (
        <>
          <input
            type="file"
            hidden
            id="cover-upload"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadCover(f);
            }}
          />
          <label
            htmlFor="cover-upload"
            className="absolute right-6 bottom-4 cursor-pointer text-white/90 hover:text-white"
          >
            <Camera className="w-5 h-5" />
          </label>
        </>
      )}
    </div>
  );
}
