'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import { useTelegram } from '@/components/providers/TelegramProvider';

const BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'ajndspuntnjqpiuuerbot';

/**
 * Browsing is open to everyone; actions that create an order (add to cart,
 * buy now, checkout) require a registered account. Returns a guard: it runs
 * the action when the user is registered, otherwise sends them to login
 * (browser) or the bot to register (inside Telegram).
 */
export function useRequireRegistration() {
  const { user, loading } = useAuth();
  const { webApp } = useTelegram();
  const router = useRouter();

  const registered = Boolean(user?.name && user?.phone);

  return (action: () => void): boolean => {
    // Allow while we're still resolving the session (avoids blocking a
    // registered user on their first tap); block only when we know they aren't.
    if (loading || registered) {
      action();
      return true;
    }
    if (webApp?.initData) {
      const url = `https://t.me/${BOT}`;
      if (webApp.openTelegramLink) webApp.openTelegramLink(url);
      else window.open(url, '_blank');
    } else {
      router.push('/login');
    }
    return false;
  };
}
