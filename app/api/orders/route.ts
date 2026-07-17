import { NextResponse } from 'next/server';
import { listOrders, createOrder } from '@/lib/db';
import { isAdminRequest } from '@/lib/server/adminAuth';
import { currentUserId } from '@/lib/server/userAuth';
import { notifyOperator, notifyOrdersGroup } from '@/lib/server/chatRelay';

const DELIVERY_LABEL: Record<string, string> = {
  pickup: "Do'kondan olib ketish",
  bts: 'BTS filial',
  courier: 'Kuryer',
  post: 'Pochta/kuryer',
};
const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Naqd (yetkazishda)',
  click: 'Click',
  payme: 'Payme',
  bts: 'BTS',
};
const money = (n?: number) => (n || 0).toLocaleString('ru-RU');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ orders: listOrders() });
}

export async function POST(req: Request) {
  let body: {
    id?: string;
    number?: string;
    status?: string;
    customerName?: string;
    phone?: string;
    userId?: string;
    total?: number;
    payload?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  // Trust the server session for identity when present (browser account or
  // Telegram), falling back to the client-provided id.
  const order = createOrder({ ...body, userId: currentUserId(req) || body.userId });

  const payload = (body.payload || {}) as {
    items?: Array<{ name?: string; price?: number; quantity?: number }>;
    delivery?: { method?: string; bts?: { branchName?: string; cityName?: string }; address?: { city?: string; street?: string } };
    payment?: { method?: string };
  };

  // Delivery + payment, human-readable.
  let deliveryText = payload.delivery?.method
    ? DELIVERY_LABEL[payload.delivery.method] || payload.delivery.method
    : '—';
  if (payload.delivery?.bts?.branchName) {
    deliveryText += ` (${[payload.delivery.bts.cityName, payload.delivery.bts.branchName].filter(Boolean).join(', ')})`;
  } else if (payload.delivery?.address?.city) {
    deliveryText += ` (${[payload.delivery.address.city, payload.delivery.address.street].filter(Boolean).join(', ')})`;
  }
  const paymentText = payload.payment?.method ? PAYMENT_LABEL[payload.payment.method] || payload.payment.method : '—';
  const itemLines = (payload.items ?? []).map(
    (it) => `• ${it.name ?? '—'} × ${it.quantity ?? 1} — ${money((it.price ?? 0) * (it.quantity ?? 1))} so'm`,
  );

  // Every new order → the admin orders group (plain text; who/what/when).
  void notifyOrdersGroup(
    [
      `🆕 YANGI BUYURTMA  ${body.number || order.number}`,
      `🕒 ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}`,
      `👤 ${body.customerName || '-'} · ${body.phone || '-'}`,
      '━━━━━━━━━━━━',
      ...(itemLines.length ? itemLines : ['(mahsulotlar)']),
      '━━━━━━━━━━━━',
      `💰 Jami: ${money(body.total)} so'm`,
      `🚚 ${deliveryText}`,
      `💳 ${paymentText}${payload.payment?.method && payload.payment.method !== 'cash' ? ' — to‘lov kutilmoqda' : ''}`,
    ].join('\n'),
  );

  // Cash (COD) orders are accepted on placement → also ping the support operator.
  if (payload.payment?.method === 'cash') {
    void notifyOperator(
      [
        `🆕 *Yangi buyurtma* ${body.number || order.number}`,
        `👤 ${body.customerName || '-'} · ${body.phone || '-'}`,
        `💵 ${money(body.total)} so'm · Naqd (yetkazishda)`,
        `🚚 ${deliveryText}`,
      ].join('\n'),
    );
  }

  return NextResponse.json({ ok: true, order });
}
