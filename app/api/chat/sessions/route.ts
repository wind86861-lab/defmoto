import { NextResponse } from 'next/server';
import { listSessions, isRelayConfigured } from '@/lib/server/chatRelay';
import { isAdminRequest } from '@/lib/server/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({
    configured: isRelayConfigured(),
    sessions: await listSessions(),
  });
}
