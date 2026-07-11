import { NextResponse } from 'next/server';
import { operatorReplyToSession, isRelayConfigured } from '@/lib/server/chatRelay';
import { isAdminRequest } from '@/lib/server/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST { sessionId, text } — operator (admin panel) reply, delivered to the
// customer's chat session. Admin-only.
export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let body: { sessionId?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { sessionId, text } = body;
  if (!sessionId || !text?.trim()) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!isRelayConfigured()) {
    return NextResponse.json({ ok: true, delivered: false });
  }
  const delivered = operatorReplyToSession(sessionId, text.trim());
  return NextResponse.json({ ok: true, delivered });
}
