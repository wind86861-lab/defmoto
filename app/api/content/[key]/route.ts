import { NextResponse } from 'next/server';
import { getContent, setContent, hasContent } from '@/lib/db';
import { isAdminRequest } from '@/lib/server/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Only the admin-managed content stores may be persisted here.
const ALLOWED = new Set(['content-store', 'site-settings']);

export async function GET(
  _req: Request,
  { params }: { params: { key: string } },
) {
  if (!ALLOWED.has(params.key) || !hasContent(params.key)) {
    return NextResponse.json(null, { status: 404 });
  }
  return NextResponse.json(getContent(params.key, null));
}

export async function PUT(
  req: Request,
  { params }: { params: { key: string } },
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!ALLOWED.has(params.key)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  setContent(params.key, body);
  return NextResponse.json({ ok: true });
}
