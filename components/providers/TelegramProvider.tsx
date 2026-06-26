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

  // Force any pinch/auto-zoom already engaged by the WebView back to 1.0.
  // Android WebViews (incl. Telegram's in-app browser) ignore maximum-scale
  // in the viewport meta tag, so a zoom triggered on a previous page can get
  // stuck across navigations — re-writing the meta content snaps it back.
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    const original = meta.getAttribute('content') ?? '';
    meta.setAttribute('content', `${original}, maximum-scale=1.0`);
    meta.setAttribute('content', original);
  }, []);

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
