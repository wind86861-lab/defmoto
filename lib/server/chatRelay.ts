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
import { listOrders, getOrder, getUserByTelegramId } from '@/lib/db';
import { tgApi } from './tgFetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ENV_OPERATOR = process.env.TELEGRAM_OPERATOR_CHAT_ID || '';

const DATA_DIR = path.join(process.cwd(), '.data');
const CONFIG_FILE = path.join(DATA_DIR, 'chat-operator.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'chat-sessions.json');

export interface RelayMessage {
  id: string;
  author: 'operator' | 'customer';
  text: string;
  image?: string; // /uploads/... when an image was sent
  video?: string; // /uploads/... when a video was sent
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

// Fresh IPv4 connection per call (see tgFetch) — the pooled global fetch went
// stale behind the host NAT and hung, breaking operator delivery.
async function tg(method: string, body: Record<string, unknown>): Promise<any> {
  return tgApi(method, body);
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
      reply_markup: quickReplyKeyboard(sessionId),
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

function quickReplyKeyboard(sessionId?: string) {
  const rows: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < QUICK_REPLIES.length; i += 2) {
    rows.push(
      QUICK_REPLIES.slice(i, i + 2).map((q) => ({
        text: q.label,
        callback_data: `qr:${q.code}`,
      })),
    );
  }
  // A dedicated reply button — tap it, then send text OR a photo.
  if (sessionId && `reply:${sessionId}`.length <= 64) {
    rows.push([{ text: '✍️ Javob berish', callback_data: `reply:${sessionId}` }]);
  }
  return { inline_keyboard: rows };
}

/* ---------------------------- operator inbox ---------------------------- */

type CbBtn = { text: string; callback_data: string };

// Operator chat → the session they tapped "reply" on. Their next message goes
// to that session.
const pendingReplyTarget = new Map<number, string>();
export function takePendingReply(chatId: number): string | undefined {
  const s = pendingReplyTarget.get(chatId);
  if (s) pendingReplyTarget.delete(chatId);
  return s;
}

function sessionIsNew(s: Session): boolean {
  const last = s.messages[s.messages.length - 1];
  return last?.author === 'customer'; // last word is the customer's → unanswered
}

/** Inbox list — unanswered first, each session a button. */
function inboxView(): { text: string; keyboard: { inline_keyboard: CbBtn[][] } } {
  const entries = Array.from(state.sessions.entries())
    .filter(([, s]) => s.messages.length)
    .sort((a, b) => {
      const an = sessionIsNew(a[1]) ? 0 : 1;
      const bn = sessionIsNew(b[1]) ? 0 : 1;
      if (an !== bn) return an - bn;
      return b[1].lastActivity - a[1].lastActivity;
    });
  const rows: CbBtn[][] = entries.slice(0, 20).map(([id, s]) => {
    const st = sessionIsNew(s) ? '🔴' : '✅';
    const name = (s.customerName || `#${id.slice(-6)}`).slice(0, 24);
    const c = s.messages.filter((m) => m.author === 'customer').length;
    return [{ text: `${st} ${name} · ${c}`, callback_data: `sess:${id}` }];
  });
  const newCount = entries.filter(([, s]) => sessionIsNew(s)).length;
  return {
    text: rows.length
      ? `📨 *Xabarlar* — javob berilmagan: *${newCount}*\n🔴 javobsiz · ✅ javob berilgan\nBirini tanlang:`
      : '📭 Hozircha xabarlar yoʻq.',
    keyboard: { inline_keyboard: rows.length ? rows : [[{ text: '🔄 Yangilash', callback_data: 'inbox' }]] },
  };
}

/** Full conversation view for one session + a reply button. */
export function sessionView(sessionId: string): { text: string; keyboard: { inline_keyboard: CbBtn[][] } } {
  const s = state.sessions.get(sessionId);
  if (!s) {
    return { text: 'Suhbat topilmadi.', keyboard: { inline_keyboard: [[{ text: '⬅️ Orqaga', callback_data: 'inbox' }]] } };
  }
  const lines = s.messages.slice(-20).map((m) => (m.author === 'customer' ? '👤 ' : '💬 ') + m.text);
  const text = `*${s.customerName || 'Mijoz'}*\n\n${lines.join('\n\n')}`.slice(0, 3800);
  return {
    text,
    keyboard: {
      inline_keyboard: [
        [{ text: '✍️ Javob berish', callback_data: `reply:${sessionId}` }],
        [{ text: '⬅️ Orqaga', callback_data: 'inbox' }],
      ],
    },
  };
}

/** Operator reply addressed to a specific session (from the inbox flow). */
export function operatorReplyToSession(sessionId: string, text: string): boolean {
  const session = getSession(sessionId);
  session.messages.push({
    id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    author: 'operator',
    text,
    createdAt: new Date().toISOString(),
  });
  session.lastActivity = Date.now();
  persistSessions();
  if (sessionId.startsWith('tg:')) void sendBotMessage(sessionId.slice(3), `💬 *Operator:* ${text}`);
  return true;
}

/** Download a Telegram file (photo/video/document) by file_id → /uploads. */
async function downloadTelegramFile(
  fileId: string,
  fallbackExt = 'bin',
): Promise<string | undefined> {
  if (!BOT_TOKEN) return undefined;
  try {
    const r = await tg('getFile', { file_id: fileId });
    const filePath: string | undefined = r?.result?.file_path;
    if (!filePath) return undefined;
    const res = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`, {
      signal: AbortSignal.timeout(60_000),
    });
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = (filePath.split('.').pop() || fallbackExt).toLowerCase().replace(/[^a-z0-9]/g, '');
    const name = `op_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const dir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), buf);
    return `/uploads/${name}`;
  } catch {
    return undefined;
  }
}

/** Operator sends a photo reply to a session (bot chat resends it; website saves it). */
export async function operatorReplyImageToSession(
  sessionId: string,
  fileId: string,
  caption?: string,
): Promise<boolean> {
  const isTg = sessionId.startsWith('tg:');
  // Website sessions need a displayable URL; bot sessions can resend the file id.
  const imageUrl = isTg ? undefined : await downloadTelegramFile(fileId, 'jpg');
  const session = getSession(sessionId);
  session.messages.push({
    id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    author: 'operator',
    text: caption || '',
    image: imageUrl,
    createdAt: new Date().toISOString(),
  });
  session.lastActivity = Date.now();
  persistSessions();
  if (isTg) {
    await tg('sendPhoto', { chat_id: sessionId.slice(3), photo: fileId, caption: caption || undefined });
  }
  return true;
}

/** Operator replied to a forwarded message with a photo (reply-to flow). */
export async function ingestOperatorReplyPhoto(
  replyToMessageId: number,
  fileId: string,
  caption?: string,
): Promise<boolean> {
  const sessionId = state.forwarded.get(replyToMessageId);
  if (!sessionId) return false;
  return operatorReplyImageToSession(sessionId, fileId, caption);
}

/** Operator sends a video reply to a session (bot resends it; website saves it). */
export async function operatorReplyVideoToSession(
  sessionId: string,
  fileId: string,
  caption?: string,
): Promise<boolean> {
  const isTg = sessionId.startsWith('tg:');
  const videoUrl = isTg ? undefined : await downloadTelegramFile(fileId, 'mp4');
  const session = getSession(sessionId);
  session.messages.push({
    id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    author: 'operator',
    // Fallback text only if a website video couldn't be downloaded (e.g. >20MB).
    text: caption || (!isTg && !videoUrl ? '🎥 Video' : ''),
    video: videoUrl,
    createdAt: new Date().toISOString(),
  });
  session.lastActivity = Date.now();
  persistSessions();
  if (isTg) {
    await tg('sendVideo', { chat_id: sessionId.slice(3), video: fileId, caption: caption || undefined });
  }
  return true;
}

/** Operator replied to a forwarded message with a video (reply-to flow). */
export async function ingestOperatorReplyVideo(
  replyToMessageId: number,
  fileId: string,
  caption?: string,
): Promise<boolean> {
  const sessionId = state.forwarded.get(replyToMessageId);
  if (!sessionId) return false;
  return operatorReplyVideoToSession(sessionId, fileId, caption);
}

/**
 * Handle an operator tapping an inline button: quick replies, the inbox list,
 * opening a conversation, and starting a reply. Always answers the callback.
 */
export async function handleCallback(cb: {
  id: string;
  data?: string;
  from?: { id: number };
  message?: { message_id?: number; chat?: { id: number } };
}): Promise<void> {
  await ensureLoaded();
  const data = cb.data || '';
  const msgId = cb.message?.message_id;
  const chatId = cb.message?.chat?.id ?? cb.from?.id;

  const edit = async (text: string, keyboard: { inline_keyboard: CbBtn[][] }) => {
    if (chatId != null && msgId != null) {
      await tg('editMessageText', {
        chat_id: chatId,
        message_id: msgId,
        text,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  };

  // Quick reply on a forwarded message.
  if (data.startsWith('qr:') && msgId != null) {
    const qr = QUICK_REPLIES.find((q) => q.code === data.slice(3));
    const sessionId = state.forwarded.get(msgId);
    if (qr && sessionId) {
      ingestOperatorReply(msgId, qr.text);
      await tg('answerCallbackQuery', { callback_query_id: cb.id, text: `✅ Yuborildi: ${qr.label}` });
      return;
    }
    await tg('answerCallbackQuery', {
      callback_query_id: cb.id,
      text: '⚠️ Bu suhbat topilmadi (server qayta ishga tushgan boʻlishi mumkin).',
      show_alert: true,
    });
    return;
  }

  // Inbox list.
  if (data === 'inbox') {
    const v = inboxView();
    await edit(v.text, v.keyboard);
    await tg('answerCallbackQuery', { callback_query_id: cb.id });
    return;
  }

  // Open a conversation.
  if (data.startsWith('sess:')) {
    const v = sessionView(data.slice(5));
    await edit(v.text, v.keyboard);
    await tg('answerCallbackQuery', { callback_query_id: cb.id });
    return;
  }

  // Start a reply to a session.
  if (data.startsWith('reply:')) {
    const sid = data.slice(6);
    if (chatId != null) pendingReplyTarget.set(chatId, sid);
    await tg('answerCallbackQuery', { callback_query_id: cb.id, text: '✍️ Javobingizni yozing' });
    if (chatId != null) {
      await tg('sendMessage', { chat_id: chatId, text: '✍️ Javobingizni matn koʻrinishida yuboring:' });
    }
    return;
  }

  if (data === 'help') {
    await tg('answerCallbackQuery', {
      callback_query_id: cb.id,
      text:
        'Mijoz savoli shu yerga keladi. Javob berish uchun:\n' +
        '• "📨 Xabarlar" tugmasidan suhbatni oching va "Javob berish"ni bosing, yoki\n' +
        '• xabarga reply qilib yozing, yoki tez javob tugmasini bosing.',
      show_alert: true,
    });
    return;
  }

  // Customer: back to their orders list (in-chat).
  if (data === 'myorders' && chatId != null) {
    const v = customerOrdersView(chatId);
    if (msgId != null) {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: v.text, reply_markup: v.keyboard });
    } else {
      await tg('sendMessage', { chat_id: chatId, text: v.text, reply_markup: v.keyboard });
    }
    await tg('answerCallbackQuery', { callback_query_id: cb.id });
    return;
  }

  // Customer: open one order's details (in-chat). Plain text — no Markdown, so
  // product names with special characters can't break the message.
  if (data.startsWith('ord:')) {
    const v = orderDetailView(data.slice(4));
    if (!v) {
      await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'Buyurtma topilmadi', show_alert: true });
      return;
    }
    if (chatId != null && msgId != null) {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: v.text, reply_markup: v.keyboard });
    }
    await tg('answerCallbackQuery', { callback_query_id: cb.id });
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
 * A button that opens the site as a Telegram Mini App (inside Telegram) so the
 * user keeps their Telegram session/login. Mini App inline buttons are only
 * valid over HTTPS and in private chats — both true here.
 */
function openAppButton(text: string, path = ''): InlineBtn | null {
  const site = process.env.NEXT_PUBLIC_APP_URL || '';
  if (!site || !site.startsWith('https')) return null;
  return { text, web_app: { url: `${site}${path}` } };
}

/** Inline keyboard for the operator welcome / start message. */
export function startKeyboard() {
  const rows: InlineBtn[][] = [];
  rows.push([{ text: '📨 Xabarlar', callback_data: 'inbox' }]);
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
export const MENU = {
  catalog: '🛍 Katalog',
  contact: '📞 Aloqa',
  orders: '📦 Buyurtmalarim',
  password: '🔑 Parol',
  about: 'ℹ️ Biz haqimizda',
  operator: '🆘 Operator',
} as const;

/** Persistent bottom keyboard for ordinary users — always visible. */
export function customerMenuKeyboard() {
  return {
    keyboard: [
      [{ text: MENU.catalog }, { text: MENU.contact }],
      [{ text: MENU.orders }, { text: MENU.password }],
      [{ text: MENU.about }, { text: MENU.operator }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

const ORDER_STATUS: Record<string, string> = {
  received: 'Qabul qilindi',
  pending: 'Kutilmoqda',
  paid: "Toʻlandi ✅",
  confirmed: 'Tasdiqlandi',
  shipping: 'Yetkazilmoqda 🚚',
  delivered: 'Yetkazildi ✅',
  cancelled: 'Bekor qilindi ❌',
  expired: 'Muddati oʻtdi',
};

const DELIVERY_LABEL: Record<string, string> = {
  pickup: 'Doʻkondan olib ketish',
  bts: 'BTS filialidan olish',
  courier: 'Kuryer',
  post: 'Pochta / kuryer',
};
const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Naqd (yetkazishda)',
  click: 'Click',
  payme: 'Payme',
  bts: 'BTS orqali',
};
const sum = (n: number) => (n || 0).toLocaleString('ru-RU');

/** The customer's orders as one tappable inline button each (in-chat, no webview). */
function customerOrdersView(chatId: number): { text: string; keyboard: { inline_keyboard: InlineBtn[][] } } {
  const account = getUserByTelegramId(chatId);
  const ids = new Set<string>([String(chatId)]);
  if (account) ids.add(account.id);
  const orders = listOrders()
    .filter((o) => ids.has(String(o.userId ?? '')))
    .slice(0, 12);

  if (!orders.length) {
    const rows: InlineBtn[][] = [];
    const open = openAppButton('🛍 Katalog', '/catalog');
    if (open) rows.push([open]);
    return { text: 'Sizda hali buyurtmalar yoʻq. Katalogdan tanlang 👇', keyboard: { inline_keyboard: rows } };
  }
  const rows: InlineBtn[][] = orders.map((o) => [
    {
      text: `🧾 ${o.number} · ${sum(o.total)} soʻm · ${ORDER_STATUS[o.status] || o.status}`,
      callback_data: `ord:${o.id}`,
    },
  ]);
  return {
    text: `📦 Buyurtmalaringiz (${orders.length})\n\nBatafsil koʻrish uchun buyurtmani tanlang 👇`,
    keyboard: { inline_keyboard: rows },
  };
}

/** One order's full details, in-chat, with a back button. */
function orderDetailView(id: string): { text: string; keyboard: { inline_keyboard: InlineBtn[][] } } | null {
  const rec = getOrder(id);
  if (!rec) return null;
  const p = (rec.payload || {}) as {
    items?: Array<{ name?: string; price?: number; quantity?: number }>;
    delivery?: { method?: string; bts?: { branchName?: string }; address?: { city?: string; street?: string } };
    payment?: { method?: string };
    contact?: { phone?: string };
  };
  const lines: string[] = [
    `🧾 Buyurtma ${rec.number}`,
    `Holat: ${ORDER_STATUS[rec.status] || rec.status}`,
    `Sana: ${new Date(rec.createdAt).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}`,
  ];
  const items = p.items ?? [];
  if (items.length) {
    lines.push('', 'Mahsulotlar:');
    for (const it of items) {
      const qty = it.quantity ?? 1;
      lines.push(`• ${it.name ?? '—'} × ${qty} — ${sum((it.price ?? 0) * qty)} soʻm`);
    }
  }
  lines.push('', `💰 Jami: ${sum(rec.total)} soʻm`);
  const d = p.delivery;
  if (d?.method) {
    let dl = DELIVERY_LABEL[d.method] || d.method;
    if (d.bts?.branchName) dl += ` — ${d.bts.branchName}`;
    else if (d.address?.city) dl += ` — ${[d.address.city, d.address.street].filter(Boolean).join(', ')}`;
    lines.push(`🚚 ${dl}`);
  }
  if (p.payment?.method) lines.push(`💳 ${PAYMENT_LABEL[p.payment.method] || p.payment.method}`);
  if (p.contact?.phone) lines.push(`📞 ${p.contact.phone}`);

  const rows: InlineBtn[][] = [[{ text: '⬅️ Buyurtmalar', callback_data: 'myorders' }]];
  return { text: lines.join('\n'), keyboard: { inline_keyboard: rows } };
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
    case MENU.orders: {
      // chatId is the customer's Telegram id in a private chat. Each order is a
      // tappable inline button; details open in-chat (no crashing webview).
      const v = customerOrdersView(chatId);
      await tg('sendMessage', {
        chat_id: chatId,
        text: v.text,
        reply_markup: v.keyboard,
      });
      return true;
    }
    default:
      return false;
  }
}

/** Bot @username (cached via getMe) — for building deep links. */
let cachedBotUsername = '';
export async function getBotUsername(): Promise<string> {
  if (cachedBotUsername) return cachedBotUsername;
  const envName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '';
  if (!BOT_TOKEN) return envName;
  try {
    const r = await tg('getMe', {});
    if (r?.ok && r.result?.username) {
      cachedBotUsername = r.result.username;
      return cachedBotUsername;
    }
  } catch {
    /* ignore */
  }
  return envName;
}

/** Send a plain message to a specific chat (e.g. a password-reset code). */
export async function sendBotMessage(chatId: number | string, text: string): Promise<boolean> {
  if (!BOT_TOKEN) return false;
  try {
    const r = await tg('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown' });
    return Boolean(r?.ok);
  } catch {
    return false;
  }
}

/**
 * Send a new-order notification to the admin orders group. Set the group's
 * chat id in `TELEGRAM_ORDERS_CHAT_ID` (add the bot to the group, then use the
 * bot's /chatid command there to read it). Plain text — no Markdown — so
 * product names / addresses can't break the message.
 */
export async function notifyOrdersGroup(text: string): Promise<boolean> {
  const groupId = process.env.TELEGRAM_ORDERS_CHAT_ID || '';
  if (!BOT_TOKEN || !groupId) return false;
  try {
    const r = await tg('sendMessage', { chat_id: groupId, text });
    return Boolean(r?.ok);
  } catch {
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
  // Chat started from inside the bot → deliver the reply straight to that chat.
  if (sessionId.startsWith('tg:')) {
    void sendBotMessage(sessionId.slice(3), `💬 *Operator:* ${text}`);
  }
  return true;
}

/**
 * A customer wrote to the bot directly → forward to the operator and route
 * replies back to their Telegram chat (session id `tg:<chatId>`).
 */
export async function forwardBotCustomerMessage(
  chatId: number,
  name: string,
  text: string,
): Promise<{ relayed: boolean }> {
  return forwardToOperator(`tg:${chatId}`, text, name);
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
