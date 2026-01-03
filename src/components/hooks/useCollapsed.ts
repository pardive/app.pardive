'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'saltify:collapsed';

export function useCollapsed(initial = false) {
  const [collapsed, setCollapsed] = useState<boolean>(initial);

  // load once
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) setCollapsed(saved === 'true');
    } catch {}
  }, []);

  // persist on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {}
  }, [collapsed]);

  return [collapsed, setCollapsed] as const;
}

// also provide a default export so either import style works
export default useCollapsed;
