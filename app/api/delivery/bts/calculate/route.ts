import { NextResponse } from 'next/server';
import { btsCalculate, btsConfigured } from '@/lib/bts/client';
import { getBtsSender } from '@/lib/bts/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!btsConfigured()) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad-json' }, { status: 400 });
  }
  // Sender comes from the admin-managed BTS settings (env fallback); the client
  // only sends the receiver city. Weight defaults to the configured parcel weight.
  const sender = getBtsSender();
  const senderCityCode = body?.senderCityCode || sender.senderCityCode || '';
  const { receiverCityCode } = body || {};
  const weight = Number(body?.weight || process.env.BTS_DEFAULT_WEIGHT || 1);
  if (!senderCityCode || !receiverCityCode) {
    return NextResponse.json({ ok: false, error: 'missing-fields' }, { status: 400 });
  }
  try {
    const r = await btsCalculate({
      senderCityCode: String(senderCityCode),
      receiverCityCode: String(receiverCityCode),
      weight,
      pickup_type: body.pickup_type || sender.pickupType,
      dropoff_type: body.dropoff_type,
      volume: body.volume,
    });
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
