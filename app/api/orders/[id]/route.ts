import { NextResponse } from 'next/server';
import { updateOrderStatus, getOrder } from '@/lib/db';
import { isAdminRequest } from '@/lib/server/adminAuth';
import { currentUserId } from '@/lib/server/userAuth';
import { notifyOrderStatus } from '@/lib/server/orderNotify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — the order owner (or an admin) can read a single order.
export function GET(req: Request, { params }: { params: { id: string } }) {
  const order = getOrder(params.id);
  if (!order) return NextResponse.json({ ok: false }, { status: 404 });
  const uid = currentUserId(req);
  if (!isAdminRequest(req) && (!uid || String(order.userId ?? '') !== uid)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  return NextResponse.json({ ok: true, order });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body.status) return NextResponse.json({ ok: false }, { status: 400 });
  const ok = updateOrderStatus(params.id, body.status);
  if (!ok) return NextResponse.json({ ok: false }, { status: 404 });
  void notifyOrderStatus(params.id, body.status);
  return NextResponse.json({ ok: true, order: getOrder(params.id) });
}
