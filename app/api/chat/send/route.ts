import { NextResponse } from 'next/server';
import {
  forwardToOperator,
  isRelayConfigured,
  isOperatorConnected,
} from '@/lib/server/chatRelay';

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

  // Token not set or no operator connected → tell the client to use its
  // local auto-reply fallback instead.
  if (!isRelayConfigured() || !isOperatorConnected()) {
    return NextResponse.json({ ok: true, relayed: false });
  }

  const { relayed } = await forwardToOperator(sessionId, text.trim(), customerName);
  return NextResponse.json({ ok: true, relayed });
}
