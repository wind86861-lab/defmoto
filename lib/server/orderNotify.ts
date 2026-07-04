/**
 * Notify the customer on Telegram when their order status changes.
 * Only Mini-App users have a numeric Telegram chat id (order.userId); browser
 * account users are skipped (they see the status in their order history).
 */
import { getOrder } from '@/lib/db';
import { sendBotMessage } from './chatRelay';

const STATUS_LABEL: Record<string, string> = {
  received: 'Qabul qilindi',
  pending: 'Kutilmoqda',
  paid: "Toʻlandi ✅",
  confirmed: 'Tasdiqlandi',
  shipping: 'Yetkazilmoqda 🚚',
  delivered: 'Yetkazildi ✅',
  cancelled: 'Bekor qilindi ❌',
  expired: 'Muddati oʻtdi',
};

export async function notifyOrderStatus(orderId: string, status: string): Promise<void> {
  const o = getOrder(orderId);
  if (!o) return;
  const uid = String(o.userId ?? '');
  if (!/^\d+$/.test(uid)) return; // only Telegram users have a chat id
  const label = STATUS_LABEL[status] || status;
  await sendBotMessage(
    uid,
    `📦 *Buyurtma ${o.number}*\nHolat: *${label}*` +
      (o.bts?.tracking ? `\n[Kuzatish](${o.bts.tracking})` : ''),
  );
}
