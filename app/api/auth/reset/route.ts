import { NextResponse } from 'next/server';
import { getUserByPhone, updateUser } from '@/lib/db';
import {
  consumeReset,
  hashPassword,
  makeUserCookie,
  USER_COOKIE,
  USER_COOKIE_MAX_AGE,
} from '@/lib/server/userAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const secure = () => (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https');

// POST { token, code, password } — finish a reset after the bot delivered code.
export async function POST(req: Request) {
  let body: { token?: string; code?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const token = body.token || '';
  const code = (body.code || '').trim();
  const password = body.password || '';
  if (password.length < 6) {
    return NextResponse.json({ ok: false, error: 'weak-password' }, { status: 400 });
  }

  const result = consumeReset(token, code);
  if (!result) {
    return NextResponse.json({ ok: false, error: 'invalid-code' }, { status: 400 });
  }
  const user = getUserByPhone(result.phone);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'not-found' }, { status: 404 });
  }
  updateUser(user.id, { passwordHash: hashPassword(password) });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_COOKIE, makeUserCookie(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: secure(),
    path: '/',
    maxAge: USER_COOKIE_MAX_AGE,
  });
  return res;
}
