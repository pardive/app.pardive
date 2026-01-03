import { useState, useRef } from 'react';

export function useDelayedHover(delay = 150) {
  const [hovering, setHovering] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleEnter = (key: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHovering(key);
  };

  const handleLeave = (key: string) => {
    timeoutRef.current = setTimeout(() => {
      if (hovering === key) setHovering(null);
    }, delay);
  };

  return { hovering, handleEnter, handleLeave };
}
