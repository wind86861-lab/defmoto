import { NextResponse } from 'next/server';
import { getUserById, getUserByTelegramId } from '@/lib/db';
import { verifiedUserAccountId } from '@/lib/server/userAuth';
import { verifiedTelegramUserId } from '@/lib/server/telegramAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/auth/me — the current user (phone account or Telegram session).
export function GET(req: Request) {
  const accountId = verifiedUserAccountId(req);
  if (accountId) {
    const u = getUserById(accountId);
    if (u) {
      return NextResponse.json({
        user: { id: u.id, name: u.name, phone: u.phone, source: 'account' },
      });
    }
  }
  const tgId = verifiedTelegramUserId(req);
  if (tgId) {
    // A Mini App user is registered in the bot → return their linked name+phone.
    const u = getUserByTelegramId(tgId);
    return NextResponse.json({
      user: { id: tgId, name: u?.name, phone: u?.phone, source: 'telegram' },
    });
  }
  return NextResponse.json({ user: null });
}
