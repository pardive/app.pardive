'use client';

import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import ProfileView from './ProfileView';

export default function ProfileScreen() {
  const { profile } = useProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<any>({});

  if (!profile) return null;

  const save = async () => {
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });

    setEditing(false);
  };

  return (
    <div className="px-8 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My profile</h1>

        {editing ? (
          <button onClick={save} className="btn-primary">
            Save
          </button>
        ) : (
          <button onClick={() => setEditing(true)} className="btn-secondary">
            Edit
          </button>
        )}
      </div>

      <ProfileView
        profile={{ ...profile, ...draft }}
        editing={editing}
        onChange={(k, v) => setDraft({ ...draft, [k]: v })}
      />
    </div>
  );
}
