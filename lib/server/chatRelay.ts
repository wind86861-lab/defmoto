/**
 * Service-chat relay store (server-side).
 *
 * Bridges the website chat with a live operator on Telegram:
 *  - customer message  →  forwardToOperator()  →  Telegram DM to the operator
 *  - operator replies in Telegram (reply-to the message)  →  ingestOperatorReply()
 *  - website polls getMessagesSince() to pull the operator's answers
 *  - admin panel reads listSessions() to see live conversations + history
 *
 * Operator account is configured by the admin (name + phone). The phone is the
 * allow-list: a /start + shared contact only binds if the phone matches.
 *
 * Operator config AND chat sessions are persisted to JSON files under .data/
 * so conversations and routing survive restarts/redeploys.
 */

import { promises as fs } from 'fs';
import path from 'path';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ENV_OPERATOR = process.env.TELEGRAM_OPERATOR_CHAT_ID || '';

const DATA_DIR = path.join(process.cwd(), '.data');
const CONFIG_FILE = path.join(DATA_DIR, 'chat-operator.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'chat-sessions.json');

export interface RelayMessage {
  id: string;
  author: 'operator' | 'customer';
  text: string;
  createdAt: string;
}

export interface OperatorConfig {
  name: string;
  phone: string; // normalized to digits only
}

interface Session {
  messages: RelayMessage[];
  lastActivity: number;
  customerName?: string;
}

export interface SessionSummary {
  id: string;
  customerName?: string;
  lastText: string;
  lastActivity: number;
  messageCount: number;
  customerCount: number;
  messages: RelayMessage[];
}

interface RelayState {
  operatorChatId: number | null;
  operatorConfig: OperatorConfig | null;
  loaded: boolean;
  sessions: Map<string, Session>;
  forwarded: Map<number, string>; // telegram message_id -> sessionId
}

const globalRef = globalThis as unknown as { __deftChatRelay?: RelayState };

const state: RelayState =
  globalRef.__deftChatRelay ??
  (globalRef.__deftChatRelay = {
    operatorChatId: ENV_OPERATOR ? Number(ENV_OPERATOR) : null,
    operatorConfig: null,
    loaded: false,
    sessions: new Map(),
    forwarded: new Map(),
  });

export function normalizePhone(raw: string): string {
  return (raw || '').replace(/\D/g, '');
}

async function ensureLoaded() {
  if (state.loaded) return;
  state.loaded = true;

  // operator config
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<OperatorConfig> & {
      operatorChatId?: number | null;
    };
    if (parsed.name && parsed.phone) {
      state.operatorConfig = { name: parsed.name, phone: normalizePhone(parsed.phone) };
    }
    if (parsed.operatorChatId != null && state.operatorChatId == null) {
      state.operatorChatId = parsed.operatorChatId;
    }
  } catch {
    /* none yet */
  }

  // sessions + routing
  try {
    const raw = await fs.readFile(SESSIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw) as {
      sessions?: Record<string, Session>;
      forwarded?: [number, string][];
    };
    if (parsed.sessions) {
      for (const [k, v] of Object.entries(parsed.sessions)) {
        state.sessions.set(k, v);
      }
    }
    if (parsed.forwarded) {
      for (const [k, v] of parsed.forwarded) state.forwarded.set(k, v);
    }
  } catch {
    /* none yet */
  }
}

async function persistConfig() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(
      CONFIG_FILE,
      JSON.stringify(
        {
          name: state.operatorConfig?.name ?? '',
          phone: state.operatorConfig?.phone ?? '',
          operatorChatId: state.operatorChatId,
        },
        null,
        2,
      ),
    );
  } catch {
    /* best-effort */
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function persistSessions() {
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(
        SESSIONS_FILE,
        JSON.stringify({
          sessions: Object.fromEntries(state.sessions),
          forwarded: Array.from(state.forwarded.entries()),
        }),
      );
    } catch {
      /* best-effort */
    }
  }, 400);
}

/** Warm the in-memory state from disk (operator binding/config) on startup. */
export async function ensureRelayLoaded(): Promise<void> {
  await ensureLoaded();
}

export function isRelayConfigured(): boolean {
  return Boolean(BOT_TOKEN);
}

export function isOperatorConnected(): boolean {
  return state.operatorChatId != null;
}

export async function getOperatorConfig(): Promise<OperatorConfig | null> {
  await ensureLoaded();
  return state.operatorConfig;
}

export async function setOperatorConfig(name: string, phone: string) {
  await ensureLoaded();
  state.operatorConfig = { name: name.trim(), phone: normalizePhone(phone) };
  state.operatorChatId = null; // must re-/start to bind the new account
  await persistConfig();
}

export async function clearOperator() {
  await ensureLoaded();
  state.operatorConfig = null;
  state.operatorChatId = null;
  await persistConfig();
}

export type BindOutcome =
  | 'bound'
  | 'already'
  | 'need-contact'
  | 'phone-mismatch'
  | 'not-configured';

export async function tryBindOperator(
  chatId: number,
  sharedPhone?: string,
): Promise<BindOutcome> {
  await ensureLoaded();

  // Already the bound operator — never re-ask or re-bind.
  if (state.operatorChatId != null && state.operatorChatId === chatId) {
    return 'already';
  }

  const cfg = state.operatorConfig;
  // No operator configured by the admin yet → never auto-bind a random
  // visitor. The admin must set the operator phone in the admin panel first.
  if (!cfg || !cfg.phone) {
    return 'not-configured';
  }

  // A configured operator must verify by sharing their contact; only the
  // matching phone binds.
  if (!sharedPhone) return 'need-contact';
  if (normalizePhone(sharedPhone).endsWith(cfg.phone.slice(-9))) {
    state.operatorChatId = chatId;
    await persistConfig();
    return 'bound';
  }
  return 'phone-mismatch';
}

async function tg(method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

function getSession(id: string): Session {
  let s = state.sessions.get(id);
  if (!s) {
    s = { messages: [], lastActivity: Date.now() };
    state.sessions.set(id, s);
  }
  return s;
}

/** Customer → operator. Stores the message and tries to relay to Telegram. */
export async function forwardToOperator(
  sessionId: string,
  text: string,
  customerName?: string,
): Promise<{ relayed: boolean }> {
  await ensureLoaded();

  const session = getSession(sessionId);
  session.lastActivity = Date.now();
  if (customerName) session.customerName = customerName;
  session.messages.push({
    id: `cu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    author: 'customer',
    text,
    createdAt: new Date().toISOString(),
  });
  persistSessions();

  if (!BOT_TOKEN || state.operatorChatId == null) return { relayed: false };

  const who = (customerName || session.customerName || 'Mijoz').slice(0, 40);
  const shortId = sessionId.slice(-6);
  const payload =
    `👤 *${who}*  \`#${shortId}\`\n\n${text}\n\n` +
    `↩️ _Reply qilib yozing yoki tez javob tugmalaridan foydalaning:_`;

  try {
    const r = await tg('sendMessage', {
      chat_id: state.operatorChatId,
      text: payload,
      parse_mode: 'Markdown',
      reply_markup: quickReplyKeyboard(),
    });
    if (r?.ok && r.result?.message_id) {
      state.forwarded.set(r.result.message_id, sessionId);
      persistSessions();
      return { relayed: true };
    }
  } catch {
    /* network hiccup */
  }
  return { relayed: false };
}

/* ----------------------- quick-reply inline buttons ---------------------- */

interface QuickReply {
  code: string;
  label: string;
  text: string;
}

const QUICK_REPLIES: QuickReply[] = [
  {
    code: 'hi',
    label: '👋 Salom',
    text: 'Assalomu alaykum! 👋 DEFT MOTO xizmatida. Sizga qanday yordam bera olaman?',
  },
  {
    code: 'wait',
    label: '⏳ Kuting',
    text: 'Bir daqiqa kuting, hozir aniqlab beraman ⏳',
  },
  {
    code: 'stock',
    label: '✅ Mavjud',
    text: 'Ha, mavjud ✅. Saytdan buyurtma berishingiz mumkin — yordam kerak boʻlsa yozing.',
  },
  {
    code: 'call',
    label: '📞 Qoʻngʻiroq',
    text: 'Sizga qulay vaqtda qoʻngʻiroq qilsak boʻladimi? Raqamingizni yozib qoldiring 📞',
  },
  {
    code: 'thanks',
    label: '🙌 Rahmat',
    text: 'Murojaatingiz uchun rahmat! Yana savollaringiz boʻlsa, yozing 🙌',
  },
];

function quickReplyKeyboard() {
  const rows: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < QUICK_REPLIES.length; i += 2) {
    rows.push(
      QUICK_REPLIES.slice(i, i + 2).map((q) => ({
        text: q.label,
        callback_data: `qr:${q.code}`,
      })),
    );
  }
  return { inline_keyboard: rows };
}

/**
 * Handle an operator tapping an inline button. Quick-reply buttons send a
 * canned answer to the originating website session; always acknowledges the
 * callback so Telegram stops the button spinner.
 */
export async function handleCallback(cb: {
  id: string;
  data?: string;
  message?: { message_id?: number };
}): Promise<void> {
  await ensureLoaded();
  const data = cb.data || '';
  const msgId = cb.message?.message_id;

  if (data.startsWith('qr:') && msgId != null) {
    const qr = QUICK_REPLIES.find((q) => q.code === data.slice(3));
    const sessionId = state.forwarded.get(msgId);
    if (qr && sessionId) {
      ingestOperatorReply(msgId, qr.text);
      await tg('answerCallbackQuery', {
        callback_query_id: cb.id,
        text: `✅ Yuborildi: ${qr.label}`,
      });
      return;
    }
    await tg('answerCallbackQuery', {
      callback_query_id: cb.id,
      text: '⚠️ Bu suhbat topilmadi (server qayta ishga tushgan boʻlishi mumkin).',
      show_alert: true,
    });
    return;
  }

  if (data === 'help') {
    await tg('answerCallbackQuery', {
      callback_query_id: cb.id,
      text:
        'Mijoz savoli shu yerga keladi. Javob berish uchun:\n' +
        '• xabarga reply qilib yozing, yoki\n' +
        '• tez javob tugmalaridan birini bosing.\n' +
        'Javobingiz saytdagi chatga darhol yetib boradi.',
      show_alert: true,
    });
    return;
  }

  await tg('answerCallbackQuery', { callback_query_id: cb.id });
}

interface InlineBtn {
  text: string;
  url?: string;
  web_app?: { url: string };
  callback_data?: string;
}

/**
 * A button that opens the site. Over HTTPS it opens as a Telegram Mini App
 * (inside Telegram); otherwise it falls back to a normal URL button.
 */
function openAppButton(text: string, path = ''): InlineBtn | null {
  const site = process.env.NEXT_PUBLIC_APP_URL || '';
  if (!site) return null;
  const url = `${site}${path}`;
  return site.startsWith('https') ? { text, web_app: { url } } : { text, url };
}

/** Inline keyboard for the operator welcome / start message. */
export function startKeyboard() {
  const rows: InlineBtn[][] = [];
  const open = openAppButton('🛍 Doʻkonni ochish', '/catalog');
  if (open) rows.push([open]);
  rows.push([{ text: 'ℹ️ Qanday ishlaydi', callback_data: 'help' }]);
  return { inline_keyboard: rows };
}

/** Inline keyboard shown to ordinary users — opens the shop as a Mini App. */
export function customerKeyboard() {
  const rows: InlineBtn[][] = [];
  const open = openAppButton('🛍 Doʻkonni ochish', '/catalog');
  if (open) rows.push([open]);
  return { inline_keyboard: rows };
}

/* --------------------------- customer bottom menu ------------------------- */

const CONTACT_PHONE = '+998 (99) 810-70-90';
const MENU = {
  catalog: '🛍 Katalog',
  contact: '📞 Aloqa',
  about: 'ℹ️ Biz haqimizda',
  site: '🌐 Saytni ochish',
} as const;

/** Persistent bottom keyboard for ordinary users — always visible. */
export function customerMenuKeyboard() {
  return {
    keyboard: [
      [{ text: MENU.catalog }, { text: MENU.contact }],
      [{ text: MENU.about }, { text: MENU.site }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

/** True if this chat is the bound operator. */
export function isOperatorChat(chatId: number): boolean {
  return state.operatorChatId != null && state.operatorChatId === chatId;
}

/**
 * Handle a tap on the persistent customer menu. Returns true if the text
 * matched a menu button (and a reply was sent), false otherwise.
 */
export async function handleCustomerMenu(chatId: number, text: string): Promise<boolean> {
  const link = (path: string, label: string) => {
    const btn = openAppButton(label, path);
    return btn ? { inline_keyboard: [[btn]] } : undefined;
  };

  switch (text) {
    case MENU.catalog:
      await tg('sendMessage', {
        chat_id: chatId,
        text: 'Bizning katalog: mototsikllar, ehtiyot qismlar va aksessuarlar 👇',
        reply_markup: link('/catalog', '🛍 Katalogni ochish'),
      });
      return true;
    case MENU.contact:
      await tg('sendMessage', {
        chat_id: chatId,
        text:
          `📞 Telefon: ${CONTACT_PHONE}\n` +
          '🕒 Har kuni 9:00–21:00\n\n' +
          'Savolingiz boʻlsa shu yerga yozing — operatorimiz javob beradi.',
      });
      return true;
    case MENU.about:
      await tg('sendMessage', {
        chat_id: chatId,
        text:
          '*DEFT MOTO* — mototsikl, ehtiyot qism va aksessuarlar. ' +
          'Marketplace narxlaridan arzon, toʻgʻridan-toʻgʻri bizdan.',
        parse_mode: 'Markdown',
        reply_markup: link('/about', 'ℹ️ Batafsil'),
      });
      return true;
    case MENU.site:
      await tg('sendMessage', {
        chat_id: chatId,
        text: 'Saytni ochish 👇',
        reply_markup: customerKeyboard(),
      });
      return true;
    default:
      return false;
  }
}

/** Send a one-way notification (lead / new order) to the operator's Telegram. */
export async function notifyOperator(text: string): Promise<boolean> {
  await ensureLoaded();
  if (!BOT_TOKEN || state.operatorChatId == null) return false;
  try {
    const r = await tg('sendMessage', {
      chat_id: state.operatorChatId,
      text,
      parse_mode: 'Markdown',
    });
    return Boolean(r?.ok);
  } catch {
    return false;
  }
}

/** Operator reply (from the Telegram poller) → stored for the website to poll. */
export function ingestOperatorReply(replyToMessageId: number, text: string): boolean {
  const sessionId = state.forwarded.get(replyToMessageId);
  if (!sessionId) return false;
  const session = getSession(sessionId);
  session.messages.push({
    id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    author: 'operator',
    text,
    createdAt: new Date().toISOString(),
  });
  session.lastActivity = Date.now();
  persistSessions();
  return true;
}

/** Operator messages newer than `since` (epoch ms) — for the customer poll. */
export function getMessagesSince(sessionId: string, since: number): RelayMessage[] {
  const s = state.sessions.get(sessionId);
  if (!s) return [];
  return s.messages.filter(
    (m) => m.author === 'operator' && new Date(m.createdAt).getTime() > since,
  );
}

/** All sessions (newest first) — for the admin operator panel. */
export async function listSessions(): Promise<SessionSummary[]> {
  await ensureLoaded();
  return Array.from(state.sessions.entries())
    .map(([id, s]) => {
      const last = s.messages[s.messages.length - 1];
      return {
        id,
        customerName: s.customerName,
        lastText: last?.text ?? '',
        lastActivity: s.lastActivity,
        messageCount: s.messages.length,
        customerCount: s.messages.filter((m) => m.author === 'customer').length,
        messages: s.messages.slice(-50),
      };
    })
    .sort((a, b) => b.lastActivity - a.lastActivity);
}
