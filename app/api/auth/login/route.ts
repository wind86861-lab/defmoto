import { NextResponse } from 'next/server';
import { getUserByPhone } from '@/lib/db';
import {
  verifyPassword,
  makeUserCookie,
  USER_COOKIE,
  USER_COOKIE_MAX_AGE,
  normalizePhone,
} from '@/lib/server/userAuth';
import { tooManyAttempts, noteAttempt, clearAttempts, requestIp } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const secure = () => (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https');
const WINDOW = 15 * 60 * 1000;
const MAX_FAILS = 8;

export async function POST(req: Request) {
  let body: { phone?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const phone = normalizePhone(body.phone || '');
  const password = body.password || '';

  // Throttle brute-force by IP (+ target phone).
  const key = `login:${requestIp(req)}:${phone}`;
  if (tooManyAttempts(key, MAX_FAILS, WINDOW)) {
    return NextResponse.json({ ok: false, error: 'too-many-attempts' }, { status: 429 });
  }

  const user = getUserByPhone(phone);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    noteAttempt(key, WINDOW);
    return NextResponse.json({ ok: false, error: 'bad-credentials' }, { status: 401 });
  }
  clearAttempts(key);

  const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, phone: user.phone } });
  res.cookies.set(USER_COOKIE, makeUserCookie(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: secure(),
    path: '/',
    maxAge: USER_COOKIE_MAX_AGE,
  });
  return res;
}
