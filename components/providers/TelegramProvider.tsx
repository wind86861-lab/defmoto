'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface TelegramContextValue {
  webApp: TelegramWebApp | null;
  user: TelegramWebAppUser | null;
  isReady: boolean;
  isInTelegram: boolean;
  haptic: TelegramHapticFeedback | null;
}

const TelegramContext = createContext<TelegramContextValue>({
  webApp: null,
  user: null,
  isReady: false,
  isInTelegram: false,
  haptic: null,
});

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    const init = () => {
      if (cancelled) return;
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        // SDK not loaded yet — wait and retry
        setTimeout(init, 100);
        return;
      }

      try {
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#0A0A0A');
        tg.setBackgroundColor('#0A0A0A');
      } catch {
        // Older Telegram clients may not support all methods
      }

      // Sync viewport-driven CSS variables
      const syncViewport = () => {
        document.documentElement.style.setProperty(
          '--tg-viewport-height',
          `${tg.viewportHeight}px`,
        );
        document.documentElement.style.setProperty(
          '--tg-viewport-stable-height',
          `${tg.viewportStableHeight}px`,
        );
      };
      syncViewport();

      setWebApp(tg);
      setIsReady(true);
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<TelegramContextValue>(
    () => ({
      webApp,
      user: webApp?.initDataUnsafe?.user ?? null,
      isReady,
      isInTelegram: Boolean(webApp?.initData),
      haptic: webApp?.HapticFeedback ?? null,
    }),
    [webApp, isReady],
  );

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}

export function useTelegram() {
  return useContext(TelegramContext);
}
