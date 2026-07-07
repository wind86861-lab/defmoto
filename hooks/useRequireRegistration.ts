'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import { useTelegram } from '@/components/providers/TelegramProvider';

/**
 * Browsing and filling the cart are open; the real registration gate is at
 * checkout (ContactStep can't proceed without a name+phone). This guard runs
 * the action for registered users and, in the browser, sends anonymous users
 * to the login page.
 *
 * Inside the Telegram mini app we must NOT bounce to the bot on add-to-cart:
 * `openTelegramLink` closes the mini app, which looks like a crash and drops
 * the item. The user is already identified by Telegram, so we let them fill the
 * cart and rely on checkout to require registration before an order is placed.
 */
export function useRequireRegistration() {
  const { user, loading } = useAuth();
  const { webApp } = useTelegram();
  const router = useRouter();

  const registered = Boolean(user?.name && user?.phone);
  const inTelegram = Boolean(webApp?.initData);

  return (action: () => void): boolean => {
    // Registered, still resolving the session, or inside the mini app → run it.
    // (In the mini app the session may still be auto-logging-in; never bounce.)
    if (loading || registered || inTelegram) {
      action();
      return true;
    }
    // Browser + definitely anonymous → send to the login page.
    router.push('/login');
    return false;
  };
}
