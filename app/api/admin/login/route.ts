import { NextResponse } from 'next/server';
import {
  checkCredentials,
  makeSessionToken,
  isAdminRequest,
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
} from '@/lib/server/adminAuth';
import { tooManyAttempts, noteAttempt, clearAttempts, requestIp } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Session check
export function GET(req: Request) {
  return NextResponse.json({ authed: isAdminRequest(req) });
}

export async function POST(req: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  // Throttle brute-force by IP.
  const key = `admin-login:${requestIp(req)}`;
  if (tooManyAttempts(key, 8, 15 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'too-many-attempts' }, { status: 429 });
  }
  if (!checkCredentials(body.username ?? '', body.password ?? '')) {
    noteAttempt(key, 15 * 60 * 1000);
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  clearAttempts(key);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, makeSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE,
    // Only mark Secure when actually served over HTTPS, otherwise the cookie
    // would never be sent back on the current HTTP host (locking admins out).
    secure: (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https'),
  });
  return res;
}

export function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
