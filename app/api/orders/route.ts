import { NextResponse } from 'next/server';
import { listOrders, createOrder } from '@/lib/db';
import { isAdminRequest } from '@/lib/server/adminAuth';
import { currentUserId } from '@/lib/server/userAuth';
import { notifyOperator } from '@/lib/server/chatRelay';

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

  // Notify the operator on Telegram (fire-and-forget).
  const sum = order.total ? `${order.total.toLocaleString('ru-RU')} so'm` : '';
  void notifyOperator(
    [
      `🛒 *Yangi buyurtma* ${order.number}`,
      '',
      order.customerName && `👤 ${order.customerName}`,
      order.phone && `📞 ${order.phone}`,
      sum && `💰 ${sum}`,
    ]
      .filter(Boolean)
      .join('\n'),
  );

  return NextResponse.json({ ok: true, order });
}
