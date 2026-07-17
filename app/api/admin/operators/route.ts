import { NextResponse } from 'next/server';
import { listUsers, getUserById, updateUser } from '@/lib/db';
import { isAdminRequest } from '@/lib/server/adminAuth';
import {
  getOperatorConfig,
  setOperatorConfig,
  bindOperatorByTelegramId,
  clearOperator,
  isRelayConfigured,
  isOperatorConnected,
  normalizePhone,
  sendBotMessage,
} from '@/lib/server/chatRelay';

const OPERATOR_WELCOME =
  '🎧 Siz DEFT MOTO operatori etib tayinlandingiz.\n\n' +
  'Mijoz savollari shu yerga keladi. Javob berish uchun xabarga *reply* qiling ' +
  'yoki "📨 Xabarlar" tugmasidan foydalaning. Matn, rasm yoki video yuborishingiz mumkin.';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function payload() {
  const cfg = await getOperatorConfig(); // active relay operator { name, phone } | null
  const activePhone = cfg ? normalizePhone(cfg.phone) : '';
  const operators = listUsers()
    .filter((u) => u.isOperator)
    .map((u) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      telegramId: u.telegramId ?? null,
      createdAt: u.createdAt,
      active: Boolean(activePhone) && normalizePhone(u.phone || '') === activePhone,
    }));
  return {
    ok: true,
    configured: isRelayConfigured(),
    operatorConnected: isOperatorConnected(),
    operators,
  };
}

// GET — operators (users flagged isOperator) + relay status. Admin only.
export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json(await payload());
}

// POST { userId, makeOperator } — flag/unflag a user as an operator. Marking a
// user also sets them as the active relay operator (so they can bind via the
// bot and receive chats); unmarking the active one clears the relay operator.
export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let body: { userId?: string; makeOperator?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { userId, makeOperator } = body;
  if (!userId) return NextResponse.json({ ok: false }, { status: 400 });

  const user = getUserById(userId);
  if (!user) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

  updateUser(userId, { isOperator: Boolean(makeOperator) });

  if (makeOperator) {
    if (user.telegramId) {
      // High-level: bind instantly by their Telegram id (no /start needed) and
      // notify them so they know customer chats now arrive here.
      await bindOperatorByTelegramId(user.telegramId, user.name, user.phone);
      void sendBotMessage(user.telegramId, OPERATOR_WELCOME);
    } else if (user.name && (user.phone || '').replace(/\D/g, '').length >= 9) {
      // No Telegram id → set config; they bind by sharing contact in the bot.
      await setOperatorConfig(user.name, user.phone);
    }
  } else {
    // If this was the active operator, release the relay slot.
    const cfg = await getOperatorConfig();
    if (cfg && normalizePhone(cfg.phone) === normalizePhone(user.phone || '')) {
      await clearOperator();
    }
  }

  return NextResponse.json(await payload());
}
