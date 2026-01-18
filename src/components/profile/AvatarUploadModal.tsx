'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import {
  X,
  Trash2,
  Camera,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import clsx from 'clsx';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

/* ================= TYPES ================= */

type AvatarUploadModalProps = {
  open: boolean;
  onClose: () => void;
  profile: any;
  onUpdated: (newPath: string | null) => void;
};

/* ================= COMPONENT ================= */

export default function AvatarUploadModal({
  open,
  onClose,
  profile,
  onUpdated,
}: AvatarUploadModalProps) {
  const supabase = supabaseBrowser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  /* ================= RESET ================= */

  useEffect(() => {
    if (!open) {
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
    }
  }, [open]);

  /* ================= FILE PICK ================= */

  const onFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /* ================= CROP ================= */

  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  /* ================= SAVE ================= */

  const saveAvatar = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setSaving(true);

    try {
      const image = new Image();
      image.src = imageSrc;
      await new Promise((res) => (image.onload = res));

      const canvas = document.createElement('canvas');
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      const ctx = canvas.getContext('2d')!;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      const blob: Blob = await new Promise((res) =>
        canvas.toBlob((b) => res(b!), 'image/jpeg', 0.92)
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const path = `${user.id}/avatar-${Date.now()}.jpg`;

      await supabase.storage.from('avatars').upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

      await supabase
        .from('profiles')
        .update({
          avatar_url: path,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      onUpdated(path);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  /* ================= DELETE ================= */

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

    onUpdated(null);
    onClose();
  };

  if (!open) return null;

  /* ================= RENDER ================= */

  return (
    <div className="fixed inset-0 z-[200000] bg-black/40 backdrop-blur-sm grid place-items-center">
      <div className="w-[520px] bg-white rounded-md shadow-xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="font-medium">Update profile photo</div>
          <button onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5">
          {imageSrc ? (
            <div className="relative h-[300px] bg-black rounded-md overflow-hidden">
  <Cropper
    image={imageSrc}
    crop={crop}
    zoom={zoom}
    rotation={rotation}
    aspect={1}
    cropShape="round"
    showGrid={false}
    onCropChange={setCrop}
    onZoomChange={setZoom}
    onCropComplete={onCropComplete}
  />

  {/* 🔑 THIS ONE LINE CREATES BLUR OUTSIDE THE CIRCLE */}
  <div className="cropper-blur-overlay" />
</div>

          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-[300px] w-full border rounded-md grid place-items-center text-sm text-neutral-500 hover:bg-neutral-50"
            >
              Choose an image to upload
            </button>
          )}

          {/* ================= CONTROLS ================= */}
          {imageSrc && (
            <div className="mt-5 flex items-center gap-4 text-sm">
              {/* ZOOM — 40% */}
              <div className="flex items-center gap-2 w-[40%]">
                <button onClick={() => setZoom((z) => Math.max(1, z - 0.1))}>
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(+e.target.value)}
                  className="flex-1"
                />
                <button onClick={() => setZoom((z) => Math.min(3, z + 0.1))}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* STRAIGHTEN — 40% */}
              <div className="flex items-center gap-2 w-[40%]">
                <span className="text-xs text-neutral-500 w-6">-180°</span>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(+e.target.value)}
                  className="flex-1"
                />
                <span className="text-xs text-neutral-500 w-6">180°</span>
              </div>

              {/* ROTATE — 20% */}
              <div className="flex justify-end gap-2 w-[20%]">
                <button onClick={() => setRotation((r) => r - 90)}>
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button onClick={() => setRotation((r) => r + 90)}>
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between px-5 py-4 border-t">
          <div className="flex items-center gap-6">
            <button onClick={() => fileInputRef.current?.click()}>
              <Camera className="w-6 h-6" />
            </button>

            {profile?.avatar_url && (
              <button onClick={deleteAvatar}>
                <Trash2 className="w-6 h-6 text-red-600" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-md">
              Cancel
            </button>
            <button
              disabled={!imageSrc || saving}
              onClick={saveAvatar}
              className={clsx(
                'px-4 py-2 rounded-md text-white',
                saving ? 'bg-green-400' : 'bg-green-600'
              )}
            >
              Save
            </button>
          </div>
        </div>

        {/* FILE INPUT */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) =>
            e.target.files && onFileSelect(e.target.files[0])
          }
        />
      </div>
    </div>
  );
}
