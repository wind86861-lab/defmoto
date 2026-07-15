import { NextResponse } from 'next/server';
import { listUsers, listOrders } from '@/lib/db';
import { isAdminRequest } from '@/lib/server/adminAuth';
import { normalizePhone } from '@/lib/server/userAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — registered customers with their orders (admin). Never returns hashes.
export function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const users = listUsers();
  const orders = listOrders();

  const customers = users.map((u) => {
    const phone = normalizePhone(u.phone || '');
    const mine = orders.filter(
      (o) =>
        (u.telegramId && String(o.userId ?? '') === String(u.telegramId)) ||
        String(o.userId ?? '') === u.id ||
        (phone && normalizePhone(o.phone || '') === phone),
    );
    const spent = mine.reduce((s, o) => s + (o.total || 0), 0);
    return {
      id: u.id,
      name: u.name,
      phone: u.phone,
      telegramId: u.telegramId ?? null,
      createdAt: u.createdAt,
      isOperator: !!u.isOperator,
      orderCount: mine.length,
      spent,
      orders: mine.map((o) => ({
        id: o.id,
        number: o.number,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
      })),
    };
  });

  return NextResponse.json({ ok: true, customers });
}
