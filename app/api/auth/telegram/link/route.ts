import { NextResponse } from 'next/server';
import { getUserByTelegramId, getUserByPhone, createUserAccount, updateUser } from '@/lib/db';
import { normalizePhone } from '@/lib/server/userAuth';
import { verifiedTelegramUserId } from '@/lib/server/telegramAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Link a Telegram mini-app user's name + phone to an account, so checkout can
 * be completed in-app (no bot bounce) and the details are remembered next time.
 * Requires a valid Telegram session cookie (set by /api/auth/telegram).
 */
export async function POST(req: Request) {
  const tgId = verifiedTelegramUserId(req);
  if (!tgId) {
    return NextResponse.json({ ok: false, error: 'no-session' }, { status: 401 });
  }
  let body: { name?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad-json' }, { status: 400 });
  }
  const name = (body.name || '').trim();
  const phone = normalizePhone(body.phone || '');
  if (!name || phone.length < 9) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  // Prefer an account already linked to this Telegram id; else adopt an account
  // with the same phone; else create a fresh (passwordless) account.
  const existing = getUserByTelegramId(tgId);
  if (existing) {
    updateUser(existing.id, { name: name || existing.name, phone });
  } else {
    const byPhone = getUserByPhone(phone);
    if (byPhone) {
      updateUser(byPhone.id, { telegramId: tgId, name: name || byPhone.name });
    } else {
      createUserAccount({ name, phone, passwordHash: '', telegramId: tgId });
    }
  }
  return NextResponse.json({ ok: true, user: { name, phone, source: 'telegram' } });
}
