import { NextResponse } from 'next/server';
import { getUserByPhone } from '@/lib/db';
import { createReset, normalizePhone } from '@/lib/server/userAuth';
import { getBotUsername } from '@/lib/server/chatRelay';

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
  if (!getUserByPhone(phone)) {
    return NextResponse.json({ ok: false, error: 'not-found' }, { status: 404 });
  }

  const { token } = createReset(phone);
  const username = await getBotUsername();
  const botLink = username ? `https://t.me/${username}?start=rp-${token}` : null;

  return NextResponse.json({ ok: true, token, botLink });
}
