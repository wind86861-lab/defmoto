import { NextResponse } from 'next/server';
import { operatorSendToSession, isRelayConfigured } from '@/lib/server/chatRelay';
import { isAdminRequest } from '@/lib/server/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST { sessionId, text?, attachment? } — operator (admin panel) reply,
// delivered to the customer's chat session. Admin-only. Either text or an
// attachment (already uploaded via /api/upload) must be present.
export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let body: {
    sessionId?: string;
    text?: string;
    attachment?: { url?: string; kind?: 'image' | 'video' | 'file'; name?: string; size?: number };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { sessionId, text } = body;
  const att = body.attachment;
  const hasAttachment = Boolean(att?.url && att?.kind);
  if (!sessionId || (!text?.trim() && !hasAttachment)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!isRelayConfigured()) {
    return NextResponse.json({ ok: true, delivered: false });
  }
  const delivered = await operatorSendToSession(sessionId, {
    text: text?.trim(),
    attachment: hasAttachment
      ? { url: att!.url!, kind: att!.kind!, name: att!.name, size: att!.size }
      : undefined,
  });
  return NextResponse.json({ ok: true, delivered });
}
