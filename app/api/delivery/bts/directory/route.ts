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
      return ok(await btsCities(regionCode));
    }
    if (type === 'branches') {
      const regionCode = searchParams.get('regionCode') || '';
      const cityCode = searchParams.get('cityCode') || '';
      if (!regionCode || !cityCode) {
        return NextResponse.json({ ok: false, error: 'missing-region-or-city' }, { status: 400 });
      }
      return ok(await btsBranches(regionCode, cityCode));
    }
    return ok(await btsRegions());
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
  }
}

// BTS returns HTTP 200 with { status:false } for auth/IP-block errors (e.g. the
// prod host rejecting a non-whitelisted server IP). Surface that as a non-200 so
// the checkout hides the BTS option cleanly instead of showing an empty picker.
function ok(env: { status?: boolean }) {
  if (env && env.status === false) {
    return NextResponse.json(env, { status: 502 });
  }
  return NextResponse.json(env);
}
