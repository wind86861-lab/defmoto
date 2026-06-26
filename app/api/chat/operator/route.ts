import { NextResponse } from 'next/server';
import {
  getOperatorConfig,
  setOperatorConfig,
  clearOperator,
  isRelayConfigured,
  isOperatorConnected,
} from '@/lib/server/chatRelay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const cfg = await getOperatorConfig();
  return NextResponse.json({
    configured: isRelayConfigured(),
    operatorConnected: isOperatorConnected(),
    operator: cfg, // { name, phone } | null
  });
}

export async function POST(req: Request) {
  let body: { name?: string; phone?: string; clear?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (body.clear) {
    await clearOperator();
    return NextResponse.json({ ok: true, operator: null });
  }

  const name = (body.name || '').trim();
  const phone = (body.phone || '').trim();
  if (name.length < 2 || phone.replace(/\D/g, '').length < 9) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  await setOperatorConfig(name, phone);
  const cfg = await getOperatorConfig();
  return NextResponse.json({ ok: true, operator: cfg });
}
