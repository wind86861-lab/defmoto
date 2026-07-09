import { NextResponse } from 'next/server';
import { deleteLink } from '@/lib/db';
import { isAdminRequest } from '@/lib/server/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// DELETE — remove a campaign link (admin).
export function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const ok = deleteLink(params.id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
