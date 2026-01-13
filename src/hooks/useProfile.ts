'use client';

import { useEffect, useState } from 'react';

type Profile = {
  id: string;
  email: string;
  name?: string;
  job_title?: string;
  mobile?: string;
  avatar_url?: string;
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setProfile(data);
        setLoading(false);
      });
  }, []);

  return { profile, loading };
}
