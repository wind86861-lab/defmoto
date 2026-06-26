'use client';

import { useEffect, useState } from 'react';

/**
 * Returns true only after the component mounts on the client.
 * Use to prevent hydration mismatches for client-only state
 * (e.g. localStorage-backed Zustand persist).
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
