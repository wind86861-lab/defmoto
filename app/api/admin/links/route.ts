import { NextResponse } from 'next/server';
import { listLinks, createLink } from '@/lib/db';
import { isAdminRequest } from '@/lib/server/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — all campaign links with their click counts (admin).
export function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true, links: listLinks() });
}

// POST { label, target, code? } — create a new tracking link (admin).
export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let body: { label?: string; target?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad-json' }, { status: 400 });
  }
  const label = (body.label || '').trim();
  const target = (body.target || '/').trim();
  if (!label) {
    return NextResponse.json({ ok: false, error: 'label-required' }, { status: 400 });
  }
  const link = createLink({ label, target, code: body.code });
  return NextResponse.json({ ok: true, link });
}
