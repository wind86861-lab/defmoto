import { NextResponse } from 'next/server';
import { btsConfigured } from '@/lib/bts/client';
import { createShipmentForOrder } from '@/lib/bts/shipment';
import { isAdminRequest } from '@/lib/server/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/delivery/bts/shipment  { orderId, receiverCityCode?, ... }  (admin)
export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!btsConfigured()) {
    return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad-json' }, { status: 400 });
  }
  if (!body?.orderId) {
    return NextResponse.json({ ok: false, error: 'missing-orderId' }, { status: 400 });
  }
  const r = await createShipmentForOrder(String(body.orderId), {
    receiverCityCode: body.receiverCityCode,
    receiverBranchCode: body.receiverBranchCode,
    senderCityCode: body.senderCityCode,
    pickup_type: body.pickup_type,
    dropoff_type: body.dropoff_type,
    weight: body.weight ? Number(body.weight) : undefined,
  });
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
