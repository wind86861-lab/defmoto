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
  ensureRelayLoaded,
} from './chatRelay';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

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
    from?: { id: number };
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

  // 2) Shared contact → verify phone and bind.
  if (msg.contact?.phone_number) {
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

  // 4) Ordinary user tapped a persistent menu button.
  if (text && !isOperatorChat(chatId)) {
    await handleCustomerMenu(chatId, text);
  }
}

async function loop() {
  // Warm the persisted operator binding into memory on startup.
  await ensureRelayLoaded();
  try {
    await tg('deleteWebhook', { drop_pending_updates: false });
  } catch {
    /* ignore */
  }

  let offset = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const r = await tg('getUpdates', { offset, timeout: 30 });
      if (r?.ok && Array.isArray(r.result)) {
        for (const update of r.result as TgUpdate[]) {
          offset = update.update_id + 1;
          try {
            await handleUpdate(update);
          } catch {
            /* keep polling even if one update fails */
          }
        }
      } else {
        await sleep(2000);
      }
    } catch {
      await sleep(3000);
    }
  }
}

export function startTelegramPoller(): void {
  if (!BOT_TOKEN) return;
  if (globalRef.__deftPollerStarted) return;
  globalRef.__deftPollerStarted = true;
  void loop();
}
