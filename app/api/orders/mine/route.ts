import { NextResponse } from 'next/server';
import { listOrders } from '@/lib/db';
import { currentUserId } from '@/lib/server/userAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/orders/mine — the signed-in user's order history (live status).
export function GET(req: Request) {
  const uid = currentUserId(req);
  if (!uid) return NextResponse.json({ orders: [] });

  const orders = listOrders()
    .filter((o) => String(o.userId ?? '') === uid)
    .map((o) => {
      const p = (o.payload || {}) as { items?: unknown[] };
      return {
        id: o.id,
        number: o.number,
        status: o.status,
        total: o.total,
        createdAt: new Date(o.createdAt).toISOString(),
        items: Array.isArray(p.items) ? p.items : [],
        bts: o.bts ?? null,
      };
    });

  return NextResponse.json({ orders });
}
