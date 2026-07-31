import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/server/adminAuth';
import { postProductToChannel } from '@/lib/server/channelPost';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/admin/products/post  { productId } — post the product to the channel.
export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  let body: { productId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad-json' }, { status: 400 });
  }
  const productId = String(body.productId || '');
  if (!productId) {
    return NextResponse.json({ ok: false, error: 'missing-productId' }, { status: 400 });
  }
  const result = await postProductToChannel(productId);
  if (!result.ok) {
    const status = result.error === 'no-channel' ? 400 : 502;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json({ ok: true });
}
