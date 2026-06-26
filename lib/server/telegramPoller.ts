/**
 * Telegram long-poller (getUpdates).
 *
 * Runs on the Node server (started from instrumentation.ts). Pulls operator
 * messages from Telegram — no public HTTPS / webhook needed, so it works on a
 * plain HTTP server behind an IP. Routes operator replies back into the relay
 * store keyed by the message they replied to.
 */

import {
  ingestOperatorReply,
  setOperatorChatId,
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
    text?: string;
    reply_to_message?: { message_id: number };
  };
}

function handleUpdate(update: TgUpdate) {
  const msg = update.message;
  if (!msg) return;
  const chatId = msg.chat?.id;
  const text = (msg.text || '').trim();

  // Operator registers by pressing Start / sending /start in their DM.
  if (chatId != null && text.startsWith('/start')) {
    setOperatorChatId(chatId);
    void tg('sendMessage', {
      chat_id: chatId,
      text:
        '✅ Siz endi DEFT MOTO operatori sifatida ulandingiz.\n\n' +
        'Mijozlarning savollari shu yerga keladi. Javob berish uchun ' +
        'kelgan xabarning ustiga bosib (reply qilib) javobingizni yozing.',
    });
    return;
  }

  // Operator answered a forwarded question (reply-to).
  if (msg.reply_to_message?.message_id && text) {
    ingestOperatorReply(msg.reply_to_message.message_id, text);
  }
}

async function loop() {
  // Ensure webhook is off so getUpdates is allowed.
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
            handleUpdate(update);
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
