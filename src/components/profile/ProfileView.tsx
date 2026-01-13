'use client';

import Avatar from './Avatar';

type Props = {
  profile: any;
  editing: boolean;
  onChange: (key: string, value: string) => void;
};

export default function ProfileView({ profile, editing, onChange }: Props) {
  return (
    <div className="w-full rounded-xl border bg-white p-8">
      <div className="grid grid-cols-[220px_1fr] gap-10">
        {/* LEFT */}
        <Avatar profile={profile} editable={editing} />

        {/* RIGHT */}
        <div className="grid grid-cols-2 gap-x-10 gap-y-6">
          <Field
            label="Email"
            value={profile.email}
            disabled
          />

          <Field
            label="Mobile"
            value={profile.mobile}
            editing={editing}
            onChange={(v: string) => onChange('mobile', v)}
          />

          <Field
            label="Name"
            value={profile.first_name}
            editing={editing}
            onChange={(v: string) => onChange('first_name', v)}
          />

          <Field
            label="Job title"
            value={profile.job_title}
            editing={editing}
            onChange={(v: string) => onChange('job_title', v)}
          />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  editing,
  onChange,
  disabled,
}: any) {
  return (
    <div>
      <div className="text-sm text-neutral-500 mb-1">{label}</div>

      {editing && !disabled ? (
        <input
          defaultValue={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
        />
      ) : (
        <div className="text-base font-medium">
          {value || '—'}
        </div>
      )}
    </div>
  );
}
