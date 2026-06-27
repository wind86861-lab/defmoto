import { NextResponse } from 'next/server';
import { listSessions, isRelayConfigured } from '@/lib/server/chatRelay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    configured: isRelayConfigured(),
    sessions: await listSessions(),
  });
}
