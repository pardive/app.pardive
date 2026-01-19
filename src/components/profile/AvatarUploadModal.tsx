'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import {
  X,
  Camera,
  Trash2,
  RotateCcw,
  RotateCw,
  Minus,
  Plus,
  Loader2,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

/* ================= CONSTANTS ================= */

const AVATAR_SIZE = 512;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SIGNED_URL_TTL = 300;
const MAX_ZOOM = 3;

/* ================= IMAGE HELPERS ================= */

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

async function getCroppedImage(
  imageSrc: string,
  crop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE
  );

  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9)
  );
}

/* ================= TYPES ================= */

type Props = {
  open: boolean;
  onClose: () => void;
  onUpdated: (path: string | null) => void;
};

/* ================= COMPONENT ================= */

export default function AvatarUploadModal({
  open,
  onClose,
  onUpdated,
}: Props) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const fileRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [rawPath, setRawPath] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const [saving, setSaving] = useState(false);

  const hasEdits =
    zoom !== 1 || rotation !== 0 || crop.x !== 0 || crop.y !== 0;

  /* ================= CLEANUP HELPERS ================= */

  const cleanupImage = () => {
    if (imageSrc?.startsWith('blob:')) {
      URL.revokeObjectURL(imageSrc);
    }
  };

  const resetAllState = () => {
    cleanupImage();

    setImageSrc(null);
    setRawPath(null);
    setRawFile(null);

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedArea(null);

    setSaving(false);
  };

  /* ================= LOAD USER + IMAGE ================= */

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('raw_avatar_url')
        .eq('user_id', user.id)
        .single();

      if (!profile?.raw_avatar_url) {
        resetAllState();
        return;
      }

      setRawPath(profile.raw_avatar_url);

      const { data } = await supabase.storage
        .from('avatars')
        .createSignedUrl(profile.raw_avatar_url, SIGNED_URL_TTL);

      if (data?.signedUrl) {
        const blob = await fetch(data.signedUrl).then((r) => r.blob());
        setImageSrc(URL.createObjectURL(blob));
      }
    };

    load();

    return () => {
      mounted = false;
      cleanupImage();
    };
  }, [open]);

  /* ================= HANDLERS ================= */

  const onCropComplete = useCallback((_: Area, area: Area) => {
    setCroppedArea(area);
  }, []);

  const resetEdits = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const onFileSelect = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      alert('Max file size is 10MB');
      return;
    }

    cleanupImage();
    setRawFile(file);
    setImageSrc(URL.createObjectURL(file));
    resetEdits();
  };

  /* ================= DOWNLOAD ================= */

  const handleDownloadOriginal = async () => {
    if (!rawPath) return;

    const { data } = await supabase.storage
      .from('avatars')
      .createSignedUrl(rawPath, SIGNED_URL_TTL);

    if (!data?.signedUrl) return;

    const res = await fetch(data.signedUrl);
    const blob = await res.blob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profile-photo.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* ================= SAVE ================= */

  const saveAvatar = async () => {
    if (!imageSrc || !croppedArea || !userId) return;
    setSaving(true);

    try {
      const avatarBlob = await getCroppedImage(imageSrc, croppedArea);

      const basePath = `${userId}`;
      const avatarPath = `${basePath}/avatar.jpg`;
      const rawAvatarPath = `${basePath}/raw.jpg`;

      await supabase.storage.from('avatars').upload(avatarPath, avatarBlob, {
        upsert: true,
        contentType: 'image/jpeg',
      });

      await supabase.storage
        .from('avatars')
        .upload(rawAvatarPath, rawFile ?? avatarBlob, {
          upsert: true,
          contentType: 'image/jpeg',
        });

      await supabase
        .from('profiles')
        .update({
          avatar_url: avatarPath,
          raw_avatar_url: rawAvatarPath,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      resetAllState();
      onUpdated(`${avatarPath}?t=${Date.now()}`);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async () => {
    if (!userId || !confirm('Remove profile photo?')) return;
    setSaving(true);

    try {
      await supabase.storage.from('avatars').remove([
        `${userId}/avatar.jpg`,
        `${userId}/raw.jpg`,
      ]);

      await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          raw_avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      resetAllState();
      onUpdated(null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 z-[200000] bg-black/60 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-[480px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <h3 className="font-bold text-xl">Profile Photo</h3>
          <button
            onClick={() => {
              resetAllState();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div
            className={clsx(
              'relative h-[320px] rounded-xl overflow-hidden border',
              imageSrc
                ? 'bg-black'
                : 'bg-neutral-50 border-dashed border-neutral-300'
            )}
          >
            {imageSrc ? (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                restrictPosition
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center gap-4"
              >
                <ImageIcon className="w-8 h-8 text-neutral-400" />
                <span className="font-semibold text-neutral-700">
                  Upload photo
                </span>
                <p className="text-xs text-neutral-500 text-center max-w-[260px]">
                  JPG or PNG • Max 10MB<br />
                  Best results with a clear, centered face
                </p>
              </button>
            )}
          </div>

          {imageSrc && (
            <div className="mt-8 flex items-center gap-4 w-full">
              <div className="flex items-center gap-3 flex-1">
                <Minus className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="range"
                  min={0.1}
                  max={MAX_ZOOM}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(+e.target.value)}
                  className="w-full h-2 rounded-full accent-green-600 cursor-pointer"
                />
                <Plus className="w-4 h-4 text-neutral-400 shrink-0" />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setRotation((r) => r - 90)}
                  className="p-2 rounded-xl hover:bg-neutral-100 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation((r) => r + 90)}
                  className="p-2 rounded-xl hover:bg-neutral-100 transition"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-5 border-t bg-neutral-50">
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} className="p-2.5 rounded-xl hover:bg-white">
              <Camera className="w-5 h-5" />
            </button>

            {rawPath && (
              <button onClick={handleDownloadOriginal} className="p-2.5 rounded-xl hover:bg-white">
                <Download className="w-5 h-5" />
              </button>
            )}

            {rawPath && (
              <button
                onClick={handleDelete}
                className="p-2.5 rounded-xl hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              disabled={!hasEdits}
              onClick={resetEdits}
              className="
                px-4 py-2.5 rounded-xl text-sm font-semibold
                border border-green-600 text-green-600 bg-white
                hover:bg-green-50
                disabled:opacity-40
                transition-colors
              "
            >
              Reset
            </button>

            <button
              disabled={saving || !imageSrc}
              onClick={saveAvatar}
              className="
                px-6 py-2.5 rounded-xl font-semibold text-white
                bg-green-600 hover:bg-green-700
                disabled:bg-neutral-300
                transition-colors
                flex items-center gap-2
              "
            >
              {saving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save'}
            </button>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg"
          hidden
          onChange={(e) => e.target.files && onFileSelect(e.target.files[0])}
        />
      </div>
    </div>
  );
}
