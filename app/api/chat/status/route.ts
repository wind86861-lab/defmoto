import { NextResponse } from 'next/server';
import { isRelayConfigured, isOperatorConnected } from '@/lib/server/chatRelay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    configured: isRelayConfigured(),
    operatorConnected: isOperatorConnected(),
  });
}
