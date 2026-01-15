'use client';

import { useEffect, useState } from 'react';

export type Profile = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  mobile: string | null;
  job_title: string | null;
  avatar_url: string | null;
  cover_url?: string | null;
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/profile', {
          cache: 'no-store',        // ✅ IMPORTANT
          credentials: 'include',   // ✅ IMPORTANT
        });

        if (!res.ok) {
          setProfile(null);
          return;
        }

        const data = await res.json();
        setProfile(data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { profile, loading };
}
