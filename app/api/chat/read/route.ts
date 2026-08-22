import { NextResponse } from 'next/server';
import { markSessionRead } from '@/lib/server/chatRelay';
import { isAdminRequest } from '@/lib/server/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST { sessionId } — operator opened a chat → clear its unread counter.
export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let body: { sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body.sessionId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const ok = await markSessionRead(body.sessionId);
  return NextResponse.json({ ok });
}
