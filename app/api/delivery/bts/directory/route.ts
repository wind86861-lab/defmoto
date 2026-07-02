import { NextResponse } from 'next/server';
import { btsRegions, btsCities, btsBranches, btsConfigured } from '@/lib/bts/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/delivery/bts/directory?type=regions|cities|branches&regionCode=..
export async function GET(req: Request) {
  if (!btsConfigured()) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'regions';
  try {
    if (type === 'cities') {
      const regionCode = searchParams.get('regionCode') || '';
      if (!regionCode) {
        return NextResponse.json({ ok: false, error: 'missing-regionCode' }, { status: 400 });
      }
      return NextResponse.json(await btsCities(regionCode));
    }
    if (type === 'branches') {
      return NextResponse.json(await btsBranches());
    }
    return NextResponse.json(await btsRegions());
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
