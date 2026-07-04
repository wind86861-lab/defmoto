import { NextResponse } from 'next/server';
import { getUserByPhone, createUserAccount } from '@/lib/db';
import {
  hashPassword,
  makeUserCookie,
  USER_COOKIE,
  USER_COOKIE_MAX_AGE,
  normalizePhone,
} from '@/lib/server/userAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const secure = () => (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https');

export async function POST(req: Request) {
  let body: { name?: string; phone?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const name = (body.name || '').trim().slice(0, 60);
  const phone = normalizePhone(body.phone || '');
  const password = body.password || '';

  if (name.length < 2 || phone.length < 9 || password.length < 6) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  if (getUserByPhone(phone)) {
    return NextResponse.json({ ok: false, error: 'exists' }, { status: 409 });
  }

  const user = createUserAccount({ name, phone, passwordHash: hashPassword(password) });
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
