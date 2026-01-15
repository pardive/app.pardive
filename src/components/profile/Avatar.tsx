'use client';

import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function Avatar({ profile, editable }: any) {
  const supabase = supabaseBrowser();

  const upload = async (file: File) => {
    // 1. Always trust auth session, not profile.id
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const path = `avatars/${user.id}.png`;

    // 2. Upload (overwrite safely)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      console.error('[AVATAR_UPLOAD]', uploadError);
      return;
    }

    // 3. Get public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);

    // 4. Update profile row directly (single source of truth)
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        avatar_url: path, // store STORAGE PATH, not full URL
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (dbError) {
      console.error('[AVATAR_DB_UPDATE]', dbError);
      return;
    }

    // 5. Soft refresh (no full reload)
    window.dispatchEvent(new Event('profile-updated'));
  };

  // Resolve avatar URL
  const avatarUrl = profile.avatar_url
    ? supabase.storage
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

      {/* Camera icon */}
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
