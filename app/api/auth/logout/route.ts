import { NextResponse } from 'next/server';
import { USER_COOKIE } from '@/lib/server/userAuth';
import { TG_COOKIE } from '@/lib/server/telegramAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // Clear both the phone-account session and the Telegram Mini App session.
  res.cookies.set(USER_COOKIE, '', { path: '/', maxAge: 0 });
  res.cookies.set(TG_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
