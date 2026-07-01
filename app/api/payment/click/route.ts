import { NextResponse } from 'next/server';
import { handleClick } from '@/lib/payments/click';
import { ipAllowed } from '@/lib/payments/ip';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!ipAllowed(req, 'CLICK_ALLOWED_IPS')) {
    return NextResponse.json({ error: -1, error_note: 'forbidden' }, { status: 403 });
  }
  const body = await handleClick(req);
  return NextResponse.json(body);
}
