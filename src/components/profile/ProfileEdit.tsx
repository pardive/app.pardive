'use client';

import { useState } from 'react';

type Profile = {
  first_name?: string | null;
  last_name?: string | null;
  mobile?: string | null;
  job_title?: string | null;
};

export default function ProfileEdit({
  profile,
  onCancel,
}: {
  profile: Profile;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(profile);

  const update = (k: keyof Profile, v: string) =>
    setForm({ ...form, [k]: v });

  return (
    <div className="w-full max-w-[900px]">
      <h1 className="text-2xl font-semibold mb-6">Edit profile</h1>

      <div className="rounded-xl border bg-white p-8 space-y-6">
        <Input
          label="First name"
          value={form.first_name || ''}
          onChange={(v) => update('first_name', v)}
        />
        <Input
          label="Last name"
          value={form.last_name || ''}
          onChange={(v) => update('last_name', v)}
        />
        <Input
          label="Job title"
          value={form.job_title || ''}
          onChange={(v) => update('job_title', v)}
        />
        <Input
          label="Mobile"
          value={form.mobile || ''}
          onChange={(v) => update('mobile', v)}
        />

        <div className="flex gap-3 pt-4">
          <button
            className="px-4 py-2 rounded-md bg-black text-white"
            onClick={() => alert('Save API coming next')}
          >
            Save
          </button>
          <button
            className="px-4 py-2 rounded-md border"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border px-3 py-2"
      />
    </div>
  );
}
