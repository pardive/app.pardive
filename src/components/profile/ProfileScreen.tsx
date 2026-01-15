'use client';

import { useEffect, useRef, useState } from 'react';
import { Pencil, Camera } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import Avatar from '@/components/profile/Avatar';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

type Mode = 'view' | 'edit';

export default function ProfileScreen() {
  const { profile } = useProfile();
  const [draft, setDraft] = useState<any>({});
  const snapshots = useRef<Record<string, any>>({});

  useEffect(() => {
    if (profile) setDraft(profile);
  }, [profile]);

  if (!profile) return null;

  /* ---------- LOCAL UPDATE ---------- */
  const update = (key: string, value: string) => {
    setDraft((p: any) => ({ ...p, [key]: value }));
  };

  /* ---------- SNAPSHOT / RESTORE ---------- */
  const snapshot = (id: string, fields: string[]) => {
    snapshots.current[id] = fields.reduce((a: any, f) => {
      a[f] = draft[f];
      return a;
    }, {});
  };

  const restore = (id: string) => {
    if (!snapshots.current[id]) return;
    setDraft((p: any) => ({ ...p, ...snapshots.current[id] }));
  };

  /* ---------- DB SAVE (FIXED) ---------- */
  const saveFields = async (fields: string[]) => {
    const payload: any = {};

    fields.forEach((key) => {
      if (key === 'role') payload.job_title = draft.role;
      else if (key === 'mobile') payload.phone = draft.mobile;
      else payload[key] = draft[key];
    });

    const supabase = supabaseBrowser();

    const { error } = await supabase
      .from('profiles')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      // ✅ IMPORTANT FIX: use profile.id (auth uid)
      .eq('user_id', profile.id);

    if (error) {
      console.error('[PROFILE_SAVE_ERROR]', error);
      throw error;
    }
  };

  /* ---------- COVER UPLOAD (FIXED) ---------- */
  const uploadCover = async (file: File) => {
    const supabase = supabaseBrowser();
    const path = `${profile.id}.jpg`; // ✅ same fix

    const { error: uploadError } = await supabase.storage
      .from('profile-covers')
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('[COVER_UPLOAD_ERROR]', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('profile-covers')
      .getPublicUrl(path);

    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        cover_url: data.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.id); // ✅ same fix

    if (dbError) {
      console.error('[COVER_DB_ERROR]', dbError);
      throw dbError;
    }

    setDraft((p: any) => ({ ...p, cover_url: data.publicUrl }));
  };

  const name =
    `${draft.first_name ?? ''} ${draft.last_name ?? ''}`.trim() || '—';

  return (
    <div className="relative">

      {/* ================= COVER ================= */}
      <div className="relative -mt-6 -mx-8">
        <div className="h-60 bg-gradient-to-r from-neutral-900 to-neutral-700 relative">
          <input
            type="file"
            hidden
            id="cover-upload"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              await uploadCover(file);
            }}
          />
          <label
            htmlFor="cover-upload"
            className="absolute right-6 bottom-4 cursor-pointer text-white/80 hover:text-white"
          >
            <Camera className="w-5 h-5" />
          </label>
        </div>
      </div>

      {/* ================= HEADER ================= */}
      <div className="px-8">
        <div className="flex items-end gap-6 -mt-16">
          <Avatar profile={profile} size={144} editable />
          <div className="pb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{name}</h1>
              <span className="text-xs px-2 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                Inactive
              </span>
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {draft.job_title || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="px-8 mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">

        <EditableCard
          title="Personal details"
          onEdit={() =>
            snapshot('personal', [
              'first_name',
              'last_name',
              'role',
              'mobile',
              'timezone',
            ])
          }
          onCancel={() => restore('personal')}
          onSave={() =>
            saveFields([
              'first_name',
              'last_name',
              'role',
              'mobile',
              'timezone',
            ])
          }
        >
          {(mode) => (
            <>
              <Field label="First name" value={draft.first_name} mode={mode} onSave={(v) => update('first_name', v)} />
              <Field label="Last name" value={draft.last_name} mode={mode} onSave={(v) => update('last_name', v)} />
              <StaticField label="Email" value={draft.email} />
              <Field label="Role" value={draft.role} mode={mode} onSave={(v) => update('role', v)} />
              <Field label="Phone" value={draft.mobile} mode={mode} onSave={(v) => update('mobile', v)} />
              <Field label="Timezone" value={draft.timezone} mode={mode} onSave={(v) => update('timezone', v)} />
            </>
          )}
        </EditableCard>

        <EditableCard
          title="Address"
          onEdit={() => snapshot('address', ['address_line', 'country', 'zip'])}
          onCancel={() => restore('address')}
          onSave={() => saveFields(['address_line', 'country', 'zip'])}
        >
          {(mode) => (
            <>
              <Field label="Address line" value={draft.address_line} mode={mode} onSave={(v) => update('address_line', v)} />
              <Field label="Country" value={draft.country} mode={mode} onSave={(v) => update('country', v)} />
              <Field label="ZIP / Postal code" value={draft.zip} mode={mode} onSave={(v) => update('zip', v)} />
            </>
          )}
        </EditableCard>
      </div>

      {/* ================= SECURITY ================= */}
      <div className="px-8 mt-6">
        <Card title="Security">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Password</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Last updated unknown
              </div>
            </div>
            <button className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700">
              Reset password
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ================= EDITABLE CARD ================= */

function EditableCard({
  title,
  children,
  onEdit,
  onCancel,
  onSave,
}: {
  title: string;
  children: (mode: Mode) => React.ReactNode;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => Promise<void> | void;
}) {
  const [mode, setMode] = useState<Mode>('view');

  return (
    <div className="border rounded-lg p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold">{title}</div>

        {mode === 'view' ? (
          <button
            onClick={() => {
              onEdit?.();
              setMode('edit');
            }}
            className="text-sm text-neutral-500 hover:text-neutral-800 dark:text-neutral-400"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                onCancel?.();
                setMode('view');
              }}
              className="px-3 py-1.5 text-sm border rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                await onSave?.();
                setMode('view');
              }}
              className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white"
            >
              Save
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">{children(mode)}</div>
    </div>
  );
}

/* ================= FIELD ================= */

function Field({
  label,
  value,
  mode,
  onSave,
}: {
  label: string;
  value?: string;
  mode: Mode;
  onSave: (v: string) => void;
}) {
  const [inline, setInline] = useState(false);
  const [local, setLocal] = useState(value || '');

  useEffect(() => {
    setLocal(value || '');
  }, [value]);

  const editing = mode === 'edit' || inline;

  return (
    <div className="grid grid-cols-3 gap-4 items-center text-sm group">
      <div className="text-neutral-500 dark:text-neutral-400">{label}</div>

      <div className="col-span-2">
        {editing ? (
          <input
            autoFocus={inline}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onBlur={() => {
              setInline(false);
              onSave(local);
            }}
            className="w-full rounded-md px-3 py-2 text-sm border"
          />
        ) : (
          <div className="flex items-center justify-between">
            <span>{value || '—'}</span>
            <button
              onClick={() => setInline(true)}
              className="opacity-0 group-hover:opacity-100 text-neutral-400"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= STATIC FIELD ================= */

function StaticField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-3 gap-4 items-center text-sm">
      <div className="text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="col-span-2">{value || '—'}</div>
    </div>
  );
}

/* ================= CARD ================= */

function Card({ title, children }: any) {
  return (
    <div className="border rounded-lg p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
      <div className="font-semibold mb-4">{title}</div>
      {children}
    </div>
  );
}
