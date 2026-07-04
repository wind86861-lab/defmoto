import { NextResponse } from 'next/server';
import {
  listReviews,
  reviewSummary,
  saveReview,
  getUserReview,
  userPurchasedProduct,
  type ReviewRecord,
} from '@/lib/db';
import { currentUserId } from '@/lib/server/userAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function publicReview(r: ReviewRecord) {
  return {
    id: r.id,
    userName: r.userName,
    photoUrl: r.photoUrl,
    rating: r.rating,
    text: r.text,
    createdAt: r.createdAt,
  };
}

// GET /api/reviews?productId=..&userId=..
export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId') || '';
  // Prefer the verified Telegram session over any client-supplied id.
  const userId = currentUserId(req) || searchParams.get('userId') || '';
  if (!productId) {
    return NextResponse.json({ ok: false, error: 'missing-productId' }, { status: 400 });
  }
  const reviews = listReviews(productId).map(publicReview);
  const summary = reviewSummary(productId);
  const mine = userId ? getUserReview(productId, userId) : null;
  const purchased = userId ? userPurchasedProduct(userId, productId) : false;

  return NextResponse.json({
    ok: true,
    summary,
    reviews,
    purchased,
    alreadyReviewed: Boolean(mine),
    canReview: purchased,
    myReview: mine ? publicReview(mine) : null,
  });
}

// POST /api/reviews  { productId, rating, text, userId, userName, photoUrl }
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad-json' }, { status: 400 });
  }

  const productId = String(body?.productId || '');
  // Identity comes from the verified Telegram session cookie — never trust a
  // client-supplied user id for who is posting.
  const userId = currentUserId(req);
  const userName = String(body?.userName || '').slice(0, 60).trim();
  const rating = Number(body?.rating);
  const text = String(body?.text || '').slice(0, 1000).trim();
  const photoUrl = body?.photoUrl ? String(body.photoUrl) : undefined;

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'login-required' }, { status: 401 });
  }
  if (!productId) {
    return NextResponse.json({ ok: false, error: 'missing-fields' }, { status: 400 });
  }
  if (!(rating >= 1 && rating <= 5)) {
    return NextResponse.json({ ok: false, error: 'invalid-rating' }, { status: 400 });
  }
  // Only buyers of this product may review it.
  if (!userPurchasedProduct(userId, productId)) {
    return NextResponse.json({ ok: false, error: 'not-purchased' }, { status: 403 });
  }

  const review = saveReview({
    productId,
    userId,
    userName: userName || 'Mijoz',
    photoUrl,
    rating,
    text,
  });

  return NextResponse.json({
    ok: true,
    review: publicReview(review),
    summary: reviewSummary(productId),
  });
}
