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
} from './chatRelay';
import { getReset, markResetVerified, normalizePhone } from './userAuth';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// chatId → password-reset token, remembered between /start and contact share.
const pendingReset = new Map<number, string>();

const CONTACT_KB = {
  keyboard: [[{ text: '📱 Kontaktni yuborish', request_contact: true }]],
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
    message?: { message_id?: number };
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

  // 1) /start
  //    - the bound operator          → operator dashboard
  //    - everyone else               → ordinary-user welcome + shop button
  //    - operator configured, unbound→ also offer the operator to verify
  //      (only the admin-configured phone can ever become operator)
  if (text.startsWith('/start')) {
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

    const outcome = await tryBindOperator(chatId);

    if (outcome === 'already') {
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

    // Ordinary user — always welcomed with the persistent bottom menu.
    await tg('sendMessage', {
      chat_id: chatId,
      text:
        'Assalomu alaykum! 👋\n\n' +
        '*DEFT MOTO* — mototsikllar, ehtiyot qismlar va aksessuarlar. ' +
        'Quyidagi menyudan foydalaning 👇',
      parse_mode: 'Markdown',
      reply_markup: customerMenuKeyboard(),
    });

    // If the admin has configured an operator but nobody is bound yet, let
    // that operator verify by sharing their contact.
    if (outcome === 'need-contact') {
      await tg('sendMessage', {
        chat_id: chatId,
        text:
          'ℹ️ Agar siz DEFT MOTO operatori boʻlsangiz, tasdiqlash uchun ' +
          'pastdagi tugma orqali kontaktingizni yuboring. Faqat admin ' +
          'belgilagan raqam operator sifatida ulanadi.',
        reply_markup: {
          keyboard: [
            [{ text: '📱 Operator sifatida ulanish', request_contact: true }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    }
    return;
  }

  // 2) Shared contact.
  if (msg.contact?.phone_number) {
    // 2a) Password reset in progress for this chat.
    const resetToken = pendingReset.get(chatId);
    if (resetToken) {
      pendingReset.delete(chatId);
      const entry = getReset(resetToken);
      const shared = normalizePhone(msg.contact.phone_number);
      if (entry && shared.endsWith(entry.phone.slice(-9))) {
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
          text: '⛔️ Raqamingiz hisobga mos kelmadi. Saytda kiritgan raqamingiz bilan urinib koʻring.',
          reply_markup: { remove_keyboard: true },
        });
      }
      return;
    }

    // 2b) Operator verification.
    const outcome = await tryBindOperator(chatId, msg.contact.phone_number);
    if (outcome === 'bound' || outcome === 'already') {
      await tg('sendMessage', {
        chat_id: chatId,
        text:
          '✅ Tasdiqlandi! Siz endi DEFT MOTO operatorisiz. Mijoz xabarlari ' +
          'shu yerga keladi — reply qilib javob bering.',
        reply_markup: { remove_keyboard: true },
      });
      await tg('sendMessage', {
        chat_id: chatId,
        text: 'Foydali havolalar:',
        reply_markup: startKeyboard(),
      });
    } else if (outcome === 'not-configured') {
      await tg('sendMessage', {
        chat_id: chatId,
        text: 'Rahmat! Quyidagi menyudan foydalaning 👇',
        reply_markup: customerMenuKeyboard(),
      });
    } else {
      await tg('sendMessage', {
        chat_id: chatId,
        text:
          '⛔️ Bu raqam admin tomonidan operator sifatida belgilanmagan. ' +
          'Admin paneldagi raqam bilan bir xil akkauntdan urinib ko‘ring.',
        reply_markup: { remove_keyboard: true },
      });
    }
    return;
  }

  // 3) Operator answered a forwarded question (reply-to).
  if (msg.reply_to_message?.message_id && text) {
    ingestOperatorReply(msg.reply_to_message.message_id, text);
    return;
  }

  // 4) Ordinary user: a persistent menu tap, otherwise a chat message that we
  //    forward to the operator (reply comes back to this chat).
  if (text && !isOperatorChat(chatId)) {
    const handled = await handleCustomerMenu(chatId, text);
    if (!handled) {
      const name = msg.from?.first_name || msg.from?.username || 'Mijoz';
      const { relayed } = await forwardBotCustomerMessage(chatId, name, text);
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
