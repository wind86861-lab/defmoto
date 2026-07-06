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
  operatorReplyImageToSession,
  ingestOperatorReplyPhoto,
  MENU,
} from './chatRelay';
import {
  getReset,
  markResetVerified,
  normalizePhone,
  hashPassword,
  verifyPassword,
} from './userAuth';
import {
  getUserByTelegramId,
  getUserByPhone,
  createUserAccount,
  updateUser,
} from '@/lib/db';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Per-chat conversation state, remembered between messages.
type PwStep = 'reg1' | 'reg2' | 'cur' | 'new1' | 'new2';
interface PwFlow {
  step: PwStep;
  pass1?: string;
}
const pwFlows = new Map<number, PwFlow>(); // multi-step password (register / change)
const pendingReset = new Map<number, string>(); // chatId → reset token
const pendingOperatorVerify = new Set<number>(); // staff verifying as operator
const operatorChat = new Set<number>(); // customers connected to the operator
const pwFails = new Map<number, { n: number; until: number }>(); // brute-force guard

const PW_MIN = 6;

function clearState(chatId: number) {
  pwFlows.delete(chatId);
  pendingReset.delete(chatId);
  pendingOperatorVerify.delete(chatId);
  operatorChat.delete(chatId);
}

/** Simple per-chat rate limit for wrong current-password attempts. */
function tooManyPwFails(chatId: number): boolean {
  const r = pwFails.get(chatId);
  return Boolean(r && r.until > Date.now() && r.n >= 5);
}
function notePwFail(chatId: number) {
  const now = Date.now();
  const r = pwFails.get(chatId);
  if (!r || r.until < now) pwFails.set(chatId, { n: 1, until: now + 15 * 60 * 1000 });
  else r.n += 1;
}

async function deleteMsg(chatId: number, messageId?: number) {
  if (messageId == null) return;
  try {
    await tg('deleteMessage', { chat_id: chatId, message_id: messageId });
  } catch {
    /* message already gone / too old */
  }
}

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

const HELP_TEXT =
  'ℹ️ *DEFT MOTO — yordam*\n\n' +
  '🛍 *Katalog* — mahsulotlarni koʻrish va buyurtma berish (ilova ochiladi).\n' +
  '📦 *Buyurtmalarim* — buyurtmalaringiz holati.\n' +
  '🔑 *Parol* — saytga kirish parolini oʻrnatish/oʻzgartirish.\n' +
  '🆘 *Operator* — jonli yordamga ulanish.\n\n' +
  'Buyruqlar:\n' +
  '/start — bosh menyu\n' +
  '/register — roʻyxatdan oʻtish\n' +
  '/parol — parolni oʻzgartirish\n' +
  '/cancel — joriy amalni bekor qilish\n' +
  '/help — shu yordam\n\n' +
  '⚠️ Parolingizni hech kimga bermang. DEFT MOTO xodimlari parolni soʻramaydi.';

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
    message_id?: number;
    chat?: { id: number };
    from?: { id: number; first_name?: string; username?: string };
    text?: string;
    caption?: string;
    photo?: { file_id: string }[];
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
    const cb = update.callback_query;
    const data = cb.data || '';
    const cbChat = cb.message?.chat?.id ?? cb.from?.id;
    // Customer confirmed connecting to the operator.
    if (data === 'op-connect' && cbChat != null) {
      operatorChat.add(cbChat);
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      await tg('sendMessage', {
        chat_id: cbChat,
        text: '✅ Operatorga ulandingiz. Savolingizni yozing — operatorimiz javob beradi.\nChiqish: /cancel',
      });
      return;
    }
    if (data === 'op-cancel' && cbChat != null) {
      await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'Bekor qilindi' });
      return;
    }
    await handleCallback(cb);
    return;
  }

  const msg = update.message;
  if (!msg) return;
  const chatId = msg.chat?.id;
  if (chatId == null) return;
  const msgId = msg.message_id;
  const text = (msg.text || '').trim();
  const lower = text.toLowerCase();
  const fromId = msg.from?.id;
  const fromName = msg.from?.first_name || msg.from?.username || 'Mijoz';
  const account = () => (fromId != null ? getUserByTelegramId(fromId) : null);

  const startPasswordChange = async () => {
    const acc = account();
    if (!acc) {
      await tg('sendMessage', { chat_id: chatId, text: 'Avval roʻyxatdan oʻting — kontaktingizni yuboring 👇', reply_markup: REGISTER_KB });
      return;
    }
    if (acc.passwordHash) {
      pwFlows.set(chatId, { step: 'cur' });
      await tg('sendMessage', { chat_id: chatId, text: '🔑 Joriy parolingizni kiriting:', reply_markup: { remove_keyboard: true } });
    } else {
      pwFlows.set(chatId, { step: 'new1' });
      await tg('sendMessage', { chat_id: chatId, text: `🔑 Yangi parol oʻylab toping (kamida ${PW_MIN} belgi):`, reply_markup: { remove_keyboard: true } });
    }
  };

  /* --------------------- operator photo reply ----------------------------- */
  if (msg.photo?.length && isOperatorChat(chatId)) {
    const fileId = msg.photo[msg.photo.length - 1].file_id; // largest size
    const caption = msg.caption;
    const target = takePendingReply(chatId);
    if (target) {
      await operatorReplyImageToSession(target, fileId, caption);
      await tg('sendMessage', { chat_id: chatId, text: '✅ Rasm yuborildi.', reply_markup: startKeyboard() });
      return;
    }
    if (msg.reply_to_message?.message_id) {
      const ok = await ingestOperatorReplyPhoto(msg.reply_to_message.message_id, fileId, caption);
      await tg('sendMessage', {
        chat_id: chatId,
        text: ok ? '✅ Rasm yuborildi.' : '⚠️ Suhbat topilmadi. "📨 Xabarlar" orqali javob bering.',
      });
      return;
    }
    await tg('sendMessage', {
      chat_id: chatId,
      text: 'Rasmni yuborish uchun: "📨 Xabarlar" → suhbat → "✍️ Javob berish", soʻng rasmni yuboring.',
    });
    return;
  }

  /* ------------------------------ commands ------------------------------- */
  // /cancel — leave any in-progress flow.
  if (lower === '/cancel') {
    const had = pwFlows.has(chatId) || pendingReset.has(chatId) || pendingOperatorVerify.has(chatId) || operatorChat.has(chatId);
    clearState(chatId);
    await tg('sendMessage', { chat_id: chatId, text: had ? '✅ Bekor qilindi.' : 'Bosh menyu 👇', reply_markup: customerMenuKeyboard() });
    return;
  }
  // /help — real help text.
  if (lower === '/help') {
    await tg('sendMessage', { chat_id: chatId, text: HELP_TEXT, parse_mode: 'Markdown', reply_markup: customerMenuKeyboard() });
    return;
  }

  if (lower.startsWith('/start')) {
    const param = text.slice('/start'.length).trim();
    // Password-reset deep link: /start rp-<token>
    if (param.startsWith('rp-')) {
      const token = param.slice(3);
      if (getReset(token)) {
        pendingReset.set(chatId, token);
        await tg('sendMessage', {
          chat_id: chatId,
          text: '🔐 Parolni tiklash.\n\nTasdiqlash uchun pastdagi tugma orqali kontaktingizni yuboring — raqamingiz hisobga mos kelsa, kod yuboriladi.',
          reply_markup: CONTACT_KB,
        });
      } else {
        await tg('sendMessage', { chat_id: chatId, text: '⚠️ Tiklash havolasi eskirgan. Saytdan qaytadan urinib koʻring.' });
      }
      return;
    }
    // Registration deep link (from checkout).
    if (param === 'register') {
      const acc = account();
      if (acc?.passwordHash) {
        await tg('sendMessage', { chat_id: chatId, text: '✅ Siz allaqachon roʻyxatdan oʻtgansiz.', reply_markup: customerMenuKeyboard() });
      } else {
        await tg('sendMessage', { chat_id: chatId, text: '📝 Roʻyxatdan oʻtish uchun kontaktingizni yuboring 👇', reply_markup: REGISTER_KB });
      }
      return;
    }
    // Plain /start → open the app immediately (browsing is free; registration
    // is only needed at checkout).
    clearState(chatId);
    if (isOperatorChat(chatId)) {
      await tg('sendMessage', {
        chat_id: chatId,
        text: '✅ Siz DEFT MOTO operatorisiz.\n\nMijoz savollari shu yerga keladi — "📨 Xabarlar" orqali yoki xabarga reply qilib javob bering.',
        reply_markup: startKeyboard(),
      });
      return;
    }
    await tg('sendMessage', {
      chat_id: chatId,
      text: 'Assalomu alaykum! 👋\n\n*DEFT MOTO* — mototsikllar, ehtiyot qismlar va aksessuarlar. Katalogni ochish uchun 🛍 tugmasini bosing 👇',
      parse_mode: 'Markdown',
      reply_markup: customerMenuKeyboard(),
    });
    return;
  }

  // /register — collect contact.
  if (lower === '/register' || lower === '/royxat') {
    const acc = account();
    if (acc?.passwordHash) {
      await tg('sendMessage', { chat_id: chatId, text: '✅ Siz allaqachon roʻyxatdan oʻtgansiz.', reply_markup: customerMenuKeyboard() });
    } else {
      await tg('sendMessage', { chat_id: chatId, text: 'Kontaktingizni yuboring 👇', reply_markup: REGISTER_KB });
    }
    return;
  }

  // /parol, /setpassword, /forgot — change/set the website password.
  if (lower === '/parol' || lower === '/setpassword' || lower === '/forgot') {
    await startPasswordChange();
    return;
  }

  // /operator — staff-only verification.
  if (lower === '/operator') {
    pendingOperatorVerify.add(chatId);
    await tg('sendMessage', {
      chat_id: chatId,
      text: 'Operator sifatida ulanish uchun kontaktingizni yuboring. Faqat admin belgilagan raqam ulanadi.',
      reply_markup: CONTACT_KB,
    });
    return;
  }

  // Any other slash-command → help hint (never forwarded).
  if (text.startsWith('/')) {
    await tg('sendMessage', { chat_id: chatId, text: 'Notoʻgʻri buyruq. Yordam uchun /help', reply_markup: customerMenuKeyboard() });
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

    // b) Operator binding if explicitly requested via /operator.
    if (pendingOperatorVerify.has(chatId)) {
      pendingOperatorVerify.delete(chatId);
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

    // c) Register / link the account.
    const norm = normalizePhone(phone);
    const existing = getUserByPhone(norm);
    let acc = existing;
    if (existing) {
      if (fromId != null && existing.telegramId !== String(fromId)) {
        updateUser(existing.id, { telegramId: String(fromId) });
      }
    } else {
      acc = createUserAccount({
        name: fromName,
        phone: norm,
        passwordHash: '',
        telegramId: fromId != null ? String(fromId) : undefined,
      });
    }

    // d) Registration completes only after the password is set (entered twice).
    if (acc && !acc.passwordHash) {
      pwFlows.set(chatId, { step: 'reg1' });
      await tg('sendMessage', {
        chat_id: chatId,
        text: `📱 Raqamingiz qabul qilindi.\n\n🔑 Roʻyxatni yakunlash uchun parol oʻylab toping (kamida ${PW_MIN} belgi):`,
        reply_markup: { remove_keyboard: true },
      });
    } else if (isOperatorChat(chatId)) {
      await tg('sendMessage', { chat_id: chatId, text: '✅ Tayyor! Mijoz xabarlari shu yerga keladi.', reply_markup: startKeyboard() });
    } else {
      await tg('sendMessage', { chat_id: chatId, text: '✅ Hisobingiz ulandi! Quyidagi menyudan foydalaning 👇', reply_markup: customerMenuKeyboard() });
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

  /* -------------------- password flow (register / change) ----------------- */
  const flow = pwFlows.get(chatId);
  if (flow && text) {
    await deleteMsg(chatId, msgId); // never leave the password in chat history
    const acc = account();
    if (!acc) {
      pwFlows.delete(chatId);
      await tg('sendMessage', { chat_id: chatId, text: 'Avval roʻyxatdan oʻting 👇', reply_markup: REGISTER_KB });
      return;
    }
    // Verify the CURRENT password before allowing a change.
    if (flow.step === 'cur') {
      if (tooManyPwFails(chatId)) {
        await tg('sendMessage', { chat_id: chatId, text: '⛔️ Juda koʻp notoʻgʻri urinish. 15 daqiqadan soʻng qayta urinib koʻring. (/cancel)' });
        return;
      }
      if (!acc.passwordHash || !verifyPassword(text, acc.passwordHash)) {
        notePwFail(chatId);
        await tg('sendMessage', { chat_id: chatId, text: '❌ Joriy parol notoʻgʻri. Qaytadan kiriting yoki /cancel:' });
        return;
      }
      pwFlows.set(chatId, { step: 'new1' });
      await tg('sendMessage', { chat_id: chatId, text: `🔑 Yangi parol (kamida ${PW_MIN} belgi):` });
      return;
    }
    // First entry of the new password.
    if (flow.step === 'reg1' || flow.step === 'new1') {
      if (text.length < PW_MIN) {
        await tg('sendMessage', { chat_id: chatId, text: `Parol kamida ${PW_MIN} belgi boʻlsin. Qaytadan kiriting:` });
        return;
      }
      pwFlows.set(chatId, { step: flow.step === 'reg1' ? 'reg2' : 'new2', pass1: text });
      await tg('sendMessage', { chat_id: chatId, text: '🔁 Tasdiqlash uchun parolni qayta kiriting:' });
      return;
    }
    // Confirmation (entered twice).
    if (flow.step === 'reg2' || flow.step === 'new2') {
      const isReg = flow.step === 'reg2';
      if (text !== flow.pass1) {
        pwFlows.set(chatId, { step: isReg ? 'reg1' : 'new1' });
        await tg('sendMessage', { chat_id: chatId, text: '❌ Parollar mos kelmadi. Yangi parolni qaytadan kiriting:' });
        return;
      }
      pwFlows.delete(chatId);
      updateUser(acc.id, { passwordHash: hashPassword(text) });
      const body = isReg
        ? `✅ Roʻyxatdan oʻtdingiz! Endi buyurtma berishingiz mumkin.\n\nSaytga *${acc.phone}* + shu parol bilan ham kirishingiz mumkin.\n\n🔒 Xavfsizlik uchun parol xabarlaringiz oʻchirildi — parolni hech kimga aytmang.`
        : `✅ Parol oʻzgartirildi.\n\n🔒 Agar bu siz boʻlmasangiz — darhol /parol orqali qayta oʻzgartiring.`;
      await tg('sendMessage', { chat_id: chatId, text: body, parse_mode: 'Markdown', reply_markup: isOperatorChat(chatId) ? startKeyboard() : customerMenuKeyboard() });
      return;
    }
    return;
  }

  /* -------------------- menu buttons / free text -------------------------- */
  if (text && !isOperatorChat(chatId)) {
    // "🔑 Parol" → change/set password (asks the current password first if set).
    if (text === MENU.password) {
      await startPasswordChange();
      return;
    }
    // "🆘 Operator" → confirm before connecting.
    if (text === MENU.operator) {
      await tg('sendMessage', {
        chat_id: chatId,
        text: 'Operator bilan bogʻlanmoqchimisiz? Tasdiqlasangiz, xabaringiz operatorga yuboriladi.',
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Ha, ulanish', callback_data: 'op-connect' },
            { text: 'Yoʻq', callback_data: 'op-cancel' },
          ]],
        },
      });
      return;
    }

    // Katalog / Aloqa / Biz haqimizda / Buyurtmalarim.
    const handled = await handleCustomerMenu(chatId, text);
    if (handled) return;

    // Free text: forwarded to the operator ONLY when the customer explicitly
    // connected via 🆘 Operator — otherwise we guide them (no silent forwarding).
    if (operatorChat.has(chatId)) {
      const { relayed } = await forwardBotCustomerMessage(chatId, fromName, text);
      await tg('sendMessage', {
        chat_id: chatId,
        text: relayed ? '✅ Operatorga yuborildi.' : 'ℹ️ Qabul qilindi. Operator ulanishi bilan javob beramiz.',
      });
    } else {
      await tg('sendMessage', {
        chat_id: chatId,
        text: 'Menyudan foydalaning. Jonli yordam uchun 🆘 *Operator* tugmasini bosing.',
        parse_mode: 'Markdown',
        reply_markup: customerMenuKeyboard(),
      });
    }
    return;
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
