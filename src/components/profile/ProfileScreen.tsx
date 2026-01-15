'use client';

import { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import Avatar from '@/components/profile/Avatar';
import ProfileCover from '@/components/profile/ProfileCover';
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

  /* ---------- SAVE ---------- */
  const saveFields = async (fields: string[]) => {
    const payload: any = {};

    fields.forEach((key) => {
      if (key === 'role') payload.job_title = draft.role;
      else if (key === 'mobile') payload.phone = draft.mobile;
      else payload[key] = draft[key];
    });

    const supabase = supabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from('profiles')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
  };

  const name =
    `${draft.first_name ?? ''} ${draft.last_name ?? ''}`.trim() || '—';

  return (
    <div className="relative">
      {/* COVER */}
      <ProfileCover
        coverUrl={draft.cover_url}
        onUploaded={(path) =>
          setDraft((p: any) => ({ ...p, cover_url: path }))
        }
      />

      {/* HEADER */}
      <div className="px-8">
        <div className="flex items-end gap-6 -mt-16">
          <Avatar profile={draft} editable />
          <div className="pb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{name}</h1>
              <span className="text-xs px-2 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800">
                Inactive
              </span>
            </div>
            <div className="text-sm text-neutral-500">
              {draft.job_title || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
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
    </div>
  );
}

/* ---------- SHARED UI ---------- */

function EditableCard({ title, children, onEdit, onCancel, onSave }: any) {
  const [mode, setMode] = useState<Mode>('view');

  return (
    <div className="border rounded-lg p-6 bg-white dark:bg-neutral-900">
      <div className="flex justify-between mb-4">
        <div className="font-semibold">{title}</div>
        {mode === 'view' ? (
          <button onClick={() => { onEdit?.(); setMode('edit'); }} className="text-sm">Edit</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => { onCancel?.(); setMode('view'); }}>Cancel</button>
            <button onClick={async () => { await onSave?.(); setMode('view'); }} className="bg-green-600 text-white px-3 rounded">
              Save
            </button>
          </div>
        )}
      </div>
      {children(mode)}
    </div>
  );
}

function Field({ label, value, mode, onSave }: any) {
  const [local, setLocal] = useState(value || '');
  useEffect(() => setLocal(value || ''), [value]);

  return (
    <div className="grid grid-cols-3 gap-4 text-sm">
      <div>{label}</div>
      <div className="col-span-2">
        {mode === 'edit' ? (
          <input value={local} onChange={(e) => setLocal(e.target.value)} onBlur={() => onSave(local)} className="border px-2 py-1 w-full" />
        ) : (
          <span>{value || '—'}</span>
        )}
      </div>
    </div>
  );
}

function StaticField({ label, value }: any) {
  return (
    <div className="grid grid-cols-3 gap-4 text-sm">
      <div>{label}</div>
      <div className="col-span-2">{value || '—'}</div>
    </div>
  );
}
