'use client';

import { useCallback, useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  name?: string;
  phone?: string;
  source: 'account' | 'telegram';
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined); // undefined = loading

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me', { cache: 'no-store' });
      const j = await r.json();
      setUser(j.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
    // Re-check when the Telegram auto-login finishes (or login/logout happens).
    const onChange = () => void refresh();
    window.addEventListener('dm-auth-changed', onChange);
    return () => window.removeEventListener('dm-auth-changed', onChange);
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  return { user, loading: user === undefined, refresh, logout };
}
