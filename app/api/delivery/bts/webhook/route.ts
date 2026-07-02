import { NextResponse } from 'next/server';
import {
  getOrder,
  getOrderByBtsId,
  setOrderBts,
  updateOrderStatus,
} from '@/lib/db';
import { btsStatusToOrderStatus } from '@/lib/bts/client';
import { notifyOperator } from '@/lib/server/chatRelay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Optional shared-secret check. BTS includes the configured key when has_token. */
function keyOk(req: Request): boolean {
  const expected = process.env.BTS_WEBHOOK_KEY || '';
  if (!expected) return true; // not configured → rely on order matching only
  const got =
    req.headers.get('itx-apikey') ||
    req.headers.get('itx-apiKey') ||
    req.headers.get('x-api-key') ||
    (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return got === expected;
}

// POST /api/delivery/bts/webhook — BTS order status change callback.
export async function POST(req: Request) {
  if (!keyOk(req)) {
    return NextResponse.json({ status: false, message: 'forbidden' }, { status: 403 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: false, message: 'bad-json' }, { status: 400 });
  }

  const clientId = body?.clientId ? String(body.clientId) : '';
  const btsOrderId = Number(body?.orderId) || 0;
  const code = Number(body?.status?.code) || 0;
  const name = body?.status?.name ? String(body.status.name) : '';

  const order =
    (clientId && getOrder(clientId)) || (btsOrderId && getOrderByBtsId(btsOrderId)) || null;

  // Always ack so BTS stops retrying, even if we can't match the order.
  if (!order) {
    return NextResponse.json({ status: true, message: 'ignored.order-not-found' });
  }

  setOrderBts(order.id, {
    orderId: btsOrderId || order.bts?.orderId || 0,
    barcode: body?.barcode ? String(body.barcode) : order.bts?.barcode || '',
    statusCode: code || order.bts?.statusCode,
    statusName: name || order.bts?.statusName,
  });

  if (code) {
    updateOrderStatus(order.id, btsStatusToOrderStatus(code));
    void notifyOperator(
      `📦 *Yetkazish holati* ${order.number}\n${name || `status ${code}`}`,
    );
  }

  return NextResponse.json({ status: true, message: 'ok' });
}
