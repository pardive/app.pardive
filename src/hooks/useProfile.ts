'use client';

import { useEffect, useState } from 'react';

type Profile = {
  user_id: string;
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  mobile: string | null;
  job_title: string | null;
  avatar_url: string | null;
  cover_url?: string | null;
  timezone?: string | null;
  address_line?: string | null;
  country?: string | null;
  zip?: string | null;
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Profile | null) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        setProfile(null);
        setLoading(false);
      });
  }, []);

  return { profile, loading };
}
