'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTelegram } from '@/components/providers/TelegramProvider';
import { useAuth } from '@/hooks/useAuth';
import { useMounted } from '@/hooks/useMounted';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { MotoSpinner } from '@/components/ui/MotoLoader';

/**
 * Inside the Telegram Mini App users are auto-logged-in (initData). In a plain
 * browser they must sign in with phone + password first. Admin has its own
 * auth and is never gated here.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mounted = useMounted();
  const { isInTelegram, isReady } = useTelegram();
  const { user, loading, refresh } = useAuth();

  // Fallback so the app never hangs if the Telegram SDK fails to load.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), 2500);
    return () => clearTimeout(id);
  }, []);

  // Admin panel manages its own login.
  if (pathname?.startsWith('/admin')) return <>{children}</>;

  // Avoid a hydration flash / a premature login screen before we know the
  // Telegram + auth state.
  if (!mounted || (!isReady && !timedOut) || loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-brand-dark">
        <MotoSpinner size={48} />
      </div>
    );
  }

  if (isInTelegram || user) return <>{children}</>;

  return <AuthScreen onDone={refresh} />;
}
