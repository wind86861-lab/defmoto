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
  // Always answer 200: the API itself worked; the body says whether the channel
  // send succeeded. (A 502 here just made the browser console noisy and hid the
  // real reason.) The client reads `ok` + `detail`.
  return NextResponse.json(result);
}
