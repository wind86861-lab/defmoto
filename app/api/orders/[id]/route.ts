import { NextResponse } from 'next/server';
import { updateOrderStatus, getOrder } from '@/lib/db';
import { isAdminRequest } from '@/lib/server/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
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
  return NextResponse.json({ ok: true, order: getOrder(params.id) });
}
