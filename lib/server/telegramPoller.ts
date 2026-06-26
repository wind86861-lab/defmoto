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

import { ingestOperatorReply, tryBindOperator } from './chatRelay';

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
}

async function handleUpdate(update: TgUpdate) {
  const msg = update.message;
  if (!msg) return;
  const chatId = msg.chat?.id;
  if (chatId == null) return;
  const text = (msg.text || '').trim();

  // 1) /start → ask the operator to verify by sharing their contact.
  if (text.startsWith('/start')) {
    const outcome = await tryBindOperator(chatId);
    if (outcome === 'bound') {
      await tg('sendMessage', {
        chat_id: chatId,
        text:
          '✅ Siz DEFT MOTO operatori sifatida ulandingiz.\n\n' +
          'Mijoz savollari shu yerga keladi — javob berish uchun xabarga ' +
          'reply qiling.',
      });
    } else {
      await tg('sendMessage', {
        chat_id: chatId,
        text:
          '👋 DEFT MOTO operator ulanishi.\n\n' +
          'Tasdiqlash uchun pastdagi tugma orqali kontaktingizni yuboring.',
        reply_markup: {
          keyboard: [
            [{ text: '📱 Kontaktni yuborish', request_contact: true }],
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
    if (outcome === 'bound') {
      await tg('sendMessage', {
        chat_id: chatId,
        text:
          '✅ Tasdiqlandi! Siz endi DEFT MOTO operatorisiz. Mijoz xabarlari ' +
          'shu yerga keladi — reply qilib javob bering.',
        reply_markup: { remove_keyboard: true },
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
  }
}

async function loop() {
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
