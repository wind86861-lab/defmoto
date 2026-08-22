import { NextResponse } from 'next/server';
import { closeSession } from '@/lib/server/chatRelay';
import { isAdminRequest } from '@/lib/server/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST { sessionId } — mark a chat finished ("Yakunlash"). Admin-only.
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
  const ok = await closeSession(body.sessionId);
  return NextResponse.json({ ok });
}
