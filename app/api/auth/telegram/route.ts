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
  res.cookies.set(TG_COOKIE, makeTgCookie(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https'),
    path: '/',
    maxAge: TG_COOKIE_MAX_AGE,
  });
  return res;
}
