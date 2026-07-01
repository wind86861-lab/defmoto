import { NextResponse } from 'next/server';
import { handlePayme } from '@/lib/payments/payme';
import { ipAllowed } from '@/lib/payments/ip';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!ipAllowed(req, 'PAYME_ALLOWED_IPS')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const { status, body } = await handlePayme(req);
  return NextResponse.json(body, { status });
}
