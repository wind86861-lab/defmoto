import { NextResponse } from 'next/server';
import { btsRegisterWebhook, btsConfigured } from '@/lib/bts/client';
import { isAdminRequest } from '@/lib/server/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/delivery/bts/config → is BTS wired up? (admin)
export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({
    configured: btsConfigured(),
    baseUrl: process.env.BTS_BASE_URL || 'https://apitest.bts.uz:28345',
    environment: process.env.BTS_ENVIRONMENT || 'test',
    senderCityCode: process.env.BTS_SENDER_CITY_CODE || null,
  });
}

// POST /api/delivery/bts/config  { webhookUrl? }  (admin)
// Registers our status webhook with BTS. Defaults to <APP_URL>/api/delivery/bts/webhook.
export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!btsConfigured()) {
    return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  }
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* optional body */
  }
  const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  const webhookUrl = body?.webhookUrl || `${base}/api/delivery/bts/webhook`;
  if (!webhookUrl.startsWith('http')) {
    return NextResponse.json({ ok: false, error: 'invalid-webhook-url' }, { status: 400 });
  }
  try {
    const r = await btsRegisterWebhook(webhookUrl);
    return NextResponse.json({ ok: Boolean(r.status), webhookUrl, result: r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
