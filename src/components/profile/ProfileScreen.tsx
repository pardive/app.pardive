'use client';

import { useProfile } from '@/hooks/useProfile';

export default function ProfileScreen() {
  const { profile, loading } = useProfile();

  if (loading) return <div className="p-6">Loading…</div>;
  if (!profile) return <div className="p-6">Not logged in</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">My profile</h1>

      <div>Email: {profile.email}</div>
      <div>Name: {profile.name || '—'}</div>
      <div>Job title: {profile.job_title || '—'}</div>
      <div>Mobile: {profile.mobile || '—'}</div>
    </div>
  );
}
