import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/server/adminAuth';
import { getContent } from '@/lib/db';
import {
  addScheduledPost,
  listScheduledPosts,
  cancelScheduledPost,
  uzLocalToEpoch,
} from '@/lib/server/scheduledPosts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function productName(productId: string): string {
  const blob = getContent<{ state?: { products?: Array<{ id: string; name: string }> } } | null>(
    'content-store',
    null,
  );
  return blob?.state?.products?.find((p) => p.id === productId)?.name || 'Mahsulot';
}

// GET — list scheduled posts.
export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, items: await listScheduledPosts() });
}

// POST { productId, localTime: "YYYY-MM-DDTHH:MM" (Uzbekistan time) } — schedule.
export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ ok: false }, { status: 401 });
  let body: { productId?: string; localTime?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad-json' }, { status: 400 });
  }
  const productId = String(body.productId || '');
  if (!productId) return NextResponse.json({ ok: false, error: 'missing-productId' }, { status: 400 });

  const sendAt = uzLocalToEpoch(String(body.localTime || ''));
  if (sendAt == null) return NextResponse.json({ ok: false, error: 'bad-time' }, { status: 400 });
  if (sendAt < Date.now() - 60_000) {
    return NextResponse.json({ ok: false, error: 'past-time' }, { status: 400 });
  }

  const item = await addScheduledPost(productId, productName(productId), sendAt);
  return NextResponse.json({ ok: true, item });
}

// DELETE ?id=... — cancel a scheduled post.
export async function DELETE(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id') || '';
  const ok = await cancelScheduledPost(id);
  return NextResponse.json({ ok });
}
