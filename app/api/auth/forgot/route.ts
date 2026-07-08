import { NextResponse } from 'next/server';
import { createReset, normalizePhone } from '@/lib/server/userAuth';
import { getBotUsername } from '@/lib/server/chatRelay';
import { tooManyAttempts, noteAttempt, requestIp } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST { phone } — start a password reset; the code is delivered via the bot.
export async function POST(req: Request) {
  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const phone = normalizePhone(body.phone || '');
  if (phone.length < 9) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  // Rate-limit by IP to stop reset spam / probing.
  const key = `forgot:${requestIp(req)}`;
  if (tooManyAttempts(key, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'too-many-attempts' }, { status: 429 });
  }
  noteAttempt(key, 15 * 60 * 1000);

  // Always issue a token + bot link, whether or not the phone is registered —
  // the reset only completes for a real account (checked in /api/auth/reset),
  // so this never reveals whether a phone has an account (no user enumeration).
  const { token } = createReset(phone);
  const username = await getBotUsername();
  const botLink = username ? `https://t.me/${username}?start=rp-${token}` : null;

  return NextResponse.json({ ok: true, token, botLink });
}
