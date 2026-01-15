'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export function useProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = supabaseBrowser();
      const { data: session } = await supabase.auth.getSession();

      const res = await fetch('/api/profile', {
        headers: {
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }

      setLoading(false);
    };

    load();
  }, []);

  return { profile, loading };
}
