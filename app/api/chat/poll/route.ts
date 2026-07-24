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

  // Capture the server clock BEFORE reading messages so the client can advance
  // its cursor to a *server-origin* timestamp. The client must never seed the
  // cursor from its own (phone) clock: a device clock running ahead of the
  // server would filter out every operator reply (createdAt <= since), so the
  // reply is stored but never delivered. `now` is captured first, so any
  // message with createdAt <= now is in this batch and the next poll (since=now)
  // can't skip one.
  const now = Date.now();
  return NextResponse.json({
    ok: true,
    enabled: isRelayConfigured(),
    operatorConnected: isOperatorConnected(),
    now,
    messages: getMessagesSince(sessionId, Number.isFinite(since) ? since : 0),
  });
}
