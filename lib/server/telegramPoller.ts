/**
 * Telegram long-poller (getUpdates).
 *
 * Runs on the Node server (started from instrumentation.ts). Pulls operator
 * messages from Telegram — no public HTTPS / webhook needed, so it works on a
 * plain HTTP server behind an IP.
 *
 * Operator onboarding:
 *  /start            → bot asks the user to share their contact
 *  shares contact    → tryBindOperator() verifies the phone against the
 *                      admin-configured operator, then binds the chat
 *  reply-to a message→ routed back to the originating website session
 */

import {
  ingestOperatorReply,
  tryBindOperator,
  handleCallback,
  startKeyboard,
  customerMenuKeyboard,
  handleCustomerMenu,
  isOperatorChat,
  forwardBotCustomerMessage,
  ensureRelayLoaded,
  takePendingReply,
  operatorReplyToSession,
  MENU,
} from './chatRelay';
import { getReset, markResetVerified, normalizePhone, hashPassword } from './userAuth';
import {
  getUserByTelegramId,
  getUserByPhone,
  createUserAccount,
  updateUser,
} from '@/lib/db';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Per-chat conversation state, remembered between messages.
const pendingReset = new Map<number, string>(); // chatId → reset token
const pendingOperator = new Set<number>(); // chats verifying as operator
const pendingPassword = new Set<number>(); // chats setting a new password

const CONTACT_KB = {
  keyboard: [[{ text: '📱 Kontaktni yuborish', request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};

const REGISTER_KB = {
  keyboard: [[{ text: '📱 Roʻyxatdan oʻtish (kontakt)', request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};

const globalRef = globalThis as unknown as { __deftPollerStarted?: boolean };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function tg(method: string, params: Record<string, unknown> = {}) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

interface TgUpdate {
  update_id: number;
  message?: {
    chat?: { id: number };
    from?: { id: number; first_name?: string; username?: string };
    text?: string;
    contact?: { phone_number?: string; user_id?: number };
    reply_to_message?: { message_id: number };
  };
  callback_query?: {
    id: string;
    data?: string;
    from?: { id: number };
    message?: { message_id?: number; chat?: { id: number } };
  };
}

async function handleUpdate(update: TgUpdate) {
  // Inline button taps.
  if (update.callback_query) {
    await handleCallback(update.callback_query);
    return;
  }

  const msg = update.message;
  if (!msg) return;
  const chatId = msg.chat?.id;
  if (chatId == null) return;
  const text = (msg.text || '').trim();
  const lower = text.toLowerCase();
  const fromId = msg.from?.id;
  const fromName = msg.from?.first_name || msg.from?.username || 'Mijoz';

  /* -------------------- commands (case-insensitive, never forwarded) ------- */
  if (lower.startsWith('/start')) {
    // Password-reset deep link: /start rp-<token>
    const param = text.slice('/start'.length).trim();
    if (param.startsWith('rp-')) {
      const token = param.slice(3);
      if (getReset(token)) {
        pendingReset.set(chatId, token);
        await tg('sendMessage', {
          chat_id: chatId,
          text:
            '🔐 Parolni tiklash.\n\nTasdiqlash uchun pastdagi tugma orqali ' +
            'kontaktingizni yuboring — raqamingiz hisobga mos kelsa, kod yuboriladi.',
          reply_markup: CONTACT_KB,
        });
      } else {
        await tg('sendMessage', {
          chat_id: chatId,
          text: '⚠️ Tiklash havolasi eskirgan. Saytdan qaytadan urinib koʻring.',
        });
      }
      return;
    }

    const account = fromId != null ? getUserByTelegramId(fromId) : null;

    // Registration is required for EVERYONE — the operator too, even if already
    // designated. No account → ask for contact.
    if (!account) {
      await tg('sendMessage', {
        chat_id: chatId,
        text:
          'Assalomu alaykum! 👋 *DEFT MOTO*ga xush kelibsiz.\n\n' +
          '📝 Davom etish uchun roʻyxatdan oʻting — kontaktingizni yuboring 👇',
        parse_mode: 'Markdown',
        reply_markup: REGISTER_KB,
      });
      return;
    }
    // Contact but no password yet → must finish by setting one.
    if (!account.passwordHash) {
      pendingPassword.add(chatId);
      await tg('sendMessage', {
        chat_id: chatId,
        text: '🔑 Roʻyxatni yakunlash uchun parol oʻrnating (kamida 6 belgi). Yangi parolingizni yuboring:',
        reply_markup: { remove_keyboard: true },
      });
      return;
    }

    // Fully registered → role-specific welcome.
    if (isOperatorChat(chatId)) {
      await tg('sendMessage', {
        chat_id: chatId,
        text:
          '✅ Siz DEFT MOTO operatorisiz.\n\n' +
          'Mijoz savollari shu yerga keladi — javob berish uchun xabarga ' +
          'reply qiling yoki tez javob tugmalaridan foydalaning.',
        reply_markup: startKeyboard(),
      });
      return;
    }
    await tg('sendMessage', {
      chat_id: chatId,
      text:
        'Assalomu alaykum! 👋\n\n' +
        '*DEFT MOTO* — mototsikllar, ehtiyot qismlar va aksessuarlar. ' +
        'Quyidagi menyudan foydalaning 👇',
      parse_mode: 'Markdown',
      reply_markup: customerMenuKeyboard(),
    });
    return;
  }

  // /register — same as the /start invite.
  if (lower === '/register' || lower === '/royxat') {
    await tg('sendMessage', {
      chat_id: chatId,
      text: 'Kontaktingizni yuboring 👇',
      reply_markup: REGISTER_KB,
    });
    return;
  }

  // /parol or /setpassword or /forgot — set (or reset) the website password.
  if (lower === '/parol' || lower === '/setpassword' || lower === '/forgot') {
    const account = fromId != null ? getUserByTelegramId(fromId) : null;
    if (!account) {
      await tg('sendMessage', {
        chat_id: chatId,
        text: 'Avval /start bosib, kontaktingiz bilan roʻyxatdan oʻting.',
        reply_markup: REGISTER_KB,
      });
      return;
    }
    pendingPassword.add(chatId);
    await tg('sendMessage', {
      chat_id: chatId,
      text: '🔑 Yangi parolingizni yuboring (kamida 6 belgi):',
      reply_markup: { remove_keyboard: true },
    });
    return;
  }

  // /operator — staff-only verification (kept off /start so customers aren't asked).
  if (lower === '/operator') {
    pendingOperator.add(chatId);
    await tg('sendMessage', {
      chat_id: chatId,
      text: 'Operator sifatida ulanish uchun kontaktingizni yuboring. Faqat admin belgilagan raqam ulanadi.',
      reply_markup: CONTACT_KB,
    });
    return;
  }

  // Any other slash-command → ignore (never forward to the operator).
  if (text.startsWith('/')) {
    await tg('sendMessage', { chat_id: chatId, text: 'Menyudan foydalaning 👇', reply_markup: customerMenuKeyboard() });
    return;
  }

  /* ------------------------------- contact -------------------------------- */
  if (msg.contact?.phone_number) {
    const phone = msg.contact.phone_number;

    // a) Password reset in progress.
    const resetToken = pendingReset.get(chatId);
    if (resetToken) {
      pendingReset.delete(chatId);
      const entry = getReset(resetToken);
      if (entry && normalizePhone(phone).endsWith(entry.phone.slice(-9))) {
        markResetVerified(resetToken);
        await tg('sendMessage', {
          chat_id: chatId,
          text:
            `✅ Tasdiqlandi. Tiklash kodingiz: *${entry.code}*\n\n` +
            'Shu kodni saytdagi oynaga kiriting va yangi parol oʻrnating.',
          parse_mode: 'Markdown',
          reply_markup: { remove_keyboard: true },
        });
      } else {
        await tg('sendMessage', {
          chat_id: chatId,
          text: '⛔️ Raqamingiz hisobga mos kelmadi.',
          reply_markup: { remove_keyboard: true },
        });
      }
      return;
    }

    // b) Operator binding if explicitly requested via /operator — the operator
    //    still goes through the same registration below.
    if (pendingOperator.has(chatId)) {
      pendingOperator.delete(chatId);
      const outcome = await tryBindOperator(chatId, phone);
      await tg('sendMessage', {
        chat_id: chatId,
        text:
          outcome === 'bound' || outcome === 'already'
            ? '✅ Operator sifatida ulandingiz.'
            : outcome === 'not-configured'
              ? 'ℹ️ Operator hali admin panelida sozlanmagan.'
              : '⛔️ Bu raqam operator sifatida belgilanmagan.',
        reply_markup: { remove_keyboard: true },
      });
      // fall through to registration.
    }

    // c) Register / link the account (everyone, operator included).
    const norm = normalizePhone(phone);
    const existing = getUserByPhone(norm);
    let account = existing;
    if (existing) {
      if (fromId != null && existing.telegramId !== String(fromId)) {
        updateUser(existing.id, { telegramId: String(fromId) });
      }
    } else {
      account = createUserAccount({
        name: fromName,
        phone: norm,
        passwordHash: '',
        telegramId: fromId != null ? String(fromId) : undefined,
      });
    }

    // d) Registration is only complete once a password is set.
    if (account && !account.passwordHash) {
      pendingPassword.add(chatId);
      await tg('sendMessage', {
        chat_id: chatId,
        text:
          '📱 Raqamingiz qabul qilindi.\n\n' +
          '🔑 Roʻyxatni yakunlash uchun parol oʻrnating (kamida 6 belgi). ' +
          'Yangi parolingizni yuboring:',
        reply_markup: { remove_keyboard: true },
      });
    } else if (isOperatorChat(chatId)) {
      await tg('sendMessage', {
        chat_id: chatId,
        text: '✅ Tayyor! Mijoz xabarlari shu yerga keladi — reply qilib javob bering.',
        reply_markup: startKeyboard(),
      });
    } else {
      await tg('sendMessage', {
        chat_id: chatId,
        text: '✅ Hisobingiz ulandi! Quyidagi menyudan foydalaning 👇',
        reply_markup: customerMenuKeyboard(),
      });
    }
    return;
  }

  /* ------------------------- operator reply-to ---------------------------- */
  if (msg.reply_to_message?.message_id && text) {
    ingestOperatorReply(msg.reply_to_message.message_id, text);
    return;
  }

  // Operator answering from the inbox (they tapped "✍️ Javob berish").
  if (isOperatorChat(chatId) && text) {
    const target = takePendingReply(chatId);
    if (target) {
      operatorReplyToSession(target, text);
      await tg('sendMessage', {
        chat_id: chatId,
        text: '✅ Javob yuborildi.',
        reply_markup: startKeyboard(),
      });
      return;
    }
  }

  /* --------------------- password being set (customer) -------------------- */
  if (pendingPassword.has(chatId) && text) {
    if (text.length < 6) {
      await tg('sendMessage', { chat_id: chatId, text: 'Parol kamida 6 belgi boʻlsin. Qaytadan yuboring:' });
      return;
    }
    pendingPassword.delete(chatId);
    const account = fromId != null ? getUserByTelegramId(fromId) : null;
    if (account) {
      const first = !account.passwordHash; // completing registration
      updateUser(account.id, { passwordHash: hashPassword(text) });
      const body = first
        ? `✅ Roʻyxatdan oʻtdingiz! Endi buyurtma berishingiz mumkin.\n\nSaytga *${account.phone}* + shu parol bilan ham kirishingiz mumkin.`
        : `✅ Parol yangilandi. Saytga *${account.phone}* + shu parol bilan kiring.`;
      await tg('sendMessage', {
        chat_id: chatId,
        text: body,
        parse_mode: 'Markdown',
        reply_markup: isOperatorChat(chatId) ? startKeyboard() : customerMenuKeyboard(),
      });
    } else {
      await tg('sendMessage', { chat_id: chatId, text: 'Avval /start bosib roʻyxatdan oʻting.', reply_markup: REGISTER_KB });
    }
    return;
  }

  /* --------------------- menu / chat (registered only) -------------------- */
  if (text && !isOperatorChat(chatId)) {
    const account = fromId != null ? getUserByTelegramId(fromId) : null;

    // Not fully registered → guide them to finish, never show the menu/chat.
    if (!account) {
      await tg('sendMessage', {
        chat_id: chatId,
        text: '📝 Avval roʻyxatdan oʻting — kontaktingizni yuboring 👇',
        reply_markup: REGISTER_KB,
      });
      return;
    }
    if (!account.passwordHash) {
      pendingPassword.add(chatId);
      await tg('sendMessage', {
        chat_id: chatId,
        text: '🔑 Roʻyxatni yakunlash uchun parol oʻrnating (kamida 6 belgi):',
        reply_markup: { remove_keyboard: true },
      });
      return;
    }

    // "🔑 Parol" menu button → change password.
    if (text === MENU.password) {
      pendingPassword.add(chatId);
      await tg('sendMessage', {
        chat_id: chatId,
        text: '🔑 Yangi parolingizni yuboring (kamida 6 belgi):',
        reply_markup: { remove_keyboard: true },
      });
      return;
    }

    // Katalog / Aloqa / Biz haqimizda / Buyurtmalarim.
    const handled = await handleCustomerMenu(chatId, text);
    if (!handled) {
      const { relayed } = await forwardBotCustomerMessage(chatId, fromName, text);
      await tg('sendMessage', {
        chat_id: chatId,
        text: relayed
          ? '✅ Xabaringiz operatorga yuborildi. Tez orada javob beramiz.'
          : 'ℹ️ Xabaringiz qabul qilindi. Operator ulanishi bilan javob beramiz.',
      });
    }
  }
}

async function loop() {
  // Startup steps must never prevent the polling loop from running — a throw
  // here previously killed the whole poller (bot went silent while the web
  // server stayed up).
  try {
    await ensureRelayLoaded();
  } catch {
    /* ignore */
  }
  try {
    await tg('deleteWebhook', { drop_pending_updates: false });
  } catch {
    /* ignore */
  }

  // Show the "Open" Mini App button next to the input in every chat (HTTPS only).
  const site = process.env.NEXT_PUBLIC_APP_URL || '';
  if (site.startsWith('https')) {
    try {
      await tg('setChatMenuButton', {
        menu_button: {
          type: 'web_app',
          text: 'Ochish',
          web_app: { url: `${site}/catalog` },
        },
      });
    } catch {
      /* ignore */
    }
  }

  console.log('[poller] entering getUpdates loop');
  let offset = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const r = await tg('getUpdates', { offset, timeout: 30 });
      if (r?.ok && Array.isArray(r.result)) {
        if (r.result.length) console.log('[poller] got', r.result.length, 'update(s)');
        for (const update of r.result as TgUpdate[]) {
          offset = update.update_id + 1;
          try {
            await handleUpdate(update);
          } catch (e) {
            console.log('[poller] handleUpdate error:', (e as Error)?.message);
          }
        }
      } else {
        if (r && !r.ok) console.log('[poller] getUpdates not ok:', r.error_code, r.description);
        await sleep(2000);
      }
    } catch (e) {
      console.log('[poller] getUpdates threw:', (e as Error)?.message);
      await sleep(3000);
    }
  }
}

export function startTelegramPoller(): void {
  console.log('[poller] startTelegramPoller token?', Boolean(BOT_TOKEN), 'alreadyStarted?', Boolean(globalRef.__deftPollerStarted));
  if (!BOT_TOKEN) return;
  if (globalRef.__deftPollerStarted) return;
  globalRef.__deftPollerStarted = true;
  // The loop is meant to run forever; if it ever rejects, restart it so the
  // bot self-heals instead of going silent until the next deploy.
  const run = () => {
    loop().catch(() => setTimeout(run, 5000));
  };
  run();
}
