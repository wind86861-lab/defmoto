import { NextResponse } from 'next/server';
import {
  validateInitData,
  makeTgCookie,
  TG_COOKIE,
  TG_COOKIE_MAX_AGE,
} from '@/lib/server/telegramAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST { initData } — validate Telegram Mini App data and start a session.
export async function POST(req: Request) {
  let body: { initData?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const user = validateInitData(body.initData || '');
  if (!user) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, user });
  // The Mini App runs inside a cross-site iframe (Telegram Web/Desktop), so the
  // session cookie must be SameSite=None; Secure to be sent back on later
  // same-origin fetches — otherwise /api/auth/me sees no session and the app
  // falls back to the raw Telegram name instead of the linked account.
  const secure = (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https');
  res.cookies.set(TG_COOKIE, makeTgCookie(user.id), {
    httpOnly: true,
    sameSite: secure ? 'none' : 'lax',
    secure,
    path: '/',
    maxAge: TG_COOKIE_MAX_AGE,
  });
  return res;
}
