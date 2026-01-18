'use client';

import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { X, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { getCroppedImage } from './cropImage';

type Props = {
  open: boolean;
  onClose: () => void;
  profile: any;
  onUpdated: () => void;
};

export default function AvatarUploadModal({
  open,
  onClose,
  profile,
  onUpdated,
}: Props) {
  const supabase = supabaseBrowser();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /* ---------- FILE PICK ---------- */
  const onFileChange = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* ---------- CROP COMPLETE ---------- */
  const onCropComplete = useCallback((_a: any, cropped: any) => {
    setCroppedAreaPixels(cropped);
  }, []);

  /* ---------- SAVE ---------- */
  const saveAvatar = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setLoading(true);

      const blob = await getCroppedImage(imageSrc, croppedAreaPixels);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const path = `${user.id}/avatar.jpg`;

      await supabase.storage
        .from('avatars')
        .upload(path, blob, {
          upsert: true,
          contentType: 'image/jpeg',
        });

      await supabase
        .from('profiles')
        .update({
          avatar_url: path,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      onUpdated();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  /* ---------- DELETE ---------- */
  const deleteAvatar = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from('profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    onUpdated();
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100000] bg-black/50 backdrop-blur-sm grid place-items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[420px] rounded-xl bg-white shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-medium">Update profile photo</div>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {!imageSrc ? (
            <label className="block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-neutral-50">
              <div className="text-sm text-neutral-600">
                Upload image
              </div>
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => onFileChange(e.target.files?.[0])}
              />
            </label>
          ) : (
            <>
              <div className="relative w-full h-64 bg-neutral-900">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <button
            onClick={deleteAvatar}
            className="flex items-center gap-2 text-sm text-red-600"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={saveAvatar}
              disabled={loading || !imageSrc}
              className={clsx(
                'px-4 py-2 text-sm rounded-md text-white',
                loading ? 'bg-neutral-400' : 'bg-green-600'
              )}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
