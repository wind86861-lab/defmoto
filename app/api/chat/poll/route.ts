import { NextResponse } from 'next/server';
import {
  getMessagesSince,
  isRelayConfigured,
  isOperatorConnected,
} from '@/lib/server/chatRelay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  const since = Number(searchParams.get('since') || '0');

  if (!sessionId) {
    return NextResponse.json({ ok: false, messages: [] }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    enabled: isRelayConfigured(),
    operatorConnected: isOperatorConnected(),
    messages: getMessagesSince(sessionId, Number.isFinite(since) ? since : 0),
  });
}
