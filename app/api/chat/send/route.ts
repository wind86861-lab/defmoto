import { NextResponse } from 'next/server';
import { forwardToOperator, isRelayConfigured } from '@/lib/server/chatRelay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: { sessionId?: string; text?: string; customerName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { sessionId, text, customerName } = body;
  if (!sessionId || !text?.trim()) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Relay off (no bot token) → pure client-side mock, store nothing.
  if (!isRelayConfigured()) {
    return NextResponse.json({ ok: true, relayed: false });
  }

  // Token set → store the message + try to deliver to the connected operator.
  // `relayed` is false when no operator is connected yet (client falls back to
  // the auto-reply bot), but the message is still recorded for the admin panel.
  const { relayed } = await forwardToOperator(sessionId, text.trim(), customerName);
  return NextResponse.json({ ok: true, relayed });
}
