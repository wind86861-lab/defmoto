import { NextResponse } from 'next/server';
import { btsCalculate, btsConfigured } from '@/lib/bts/client';

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
  const { senderCityCode, receiverCityCode, weight } = body || {};
  if (!senderCityCode || !receiverCityCode || !weight) {
    return NextResponse.json({ ok: false, error: 'missing-fields' }, { status: 400 });
  }
  try {
    const r = await btsCalculate({
      senderCityCode: String(senderCityCode),
      receiverCityCode: String(receiverCityCode),
      weight: Number(weight),
      pickup_type: body.pickup_type,
      dropoff_type: body.dropoff_type,
      volume: body.volume,
    });
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
