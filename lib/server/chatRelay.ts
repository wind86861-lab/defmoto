/**
 * Service-chat relay store (server-side).
 *
 * Bridges the website chat with a live operator on Telegram:
 *  - customer message  →  forwardToOperator()  →  Telegram DM to the operator
 *  - operator replies in Telegram (reply-to the message)  →  ingestOperatorReply()
 *  - website polls getMessagesSince() to pull the operator's answers
 *
 * The operator account is configured by the admin (name + phone). That phone
 * is the allow-list: when someone presses /start and shares their contact, the
 * bot binds them as operator only if the phone matches. The operator config is
 * persisted to a small JSON file so it survives restarts/redeploys; live
 * session state is in-memory (resets on restart — fine for an MVP relay).
 */

import { promises as fs } from 'fs';
import path from 'path';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ENV_OPERATOR = process.env.TELEGRAM_OPERATOR_CHAT_ID || '';

const DATA_DIR = path.join(process.cwd(), '.data');
const CONFIG_FILE = path.join(DATA_DIR, 'chat-operator.json');

export interface RelayMessage {
  id: string;
  author: 'operator';
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
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<OperatorConfig> & {
      operatorChatId?: number | null;
    };
    if (parsed.name && parsed.phone) {
      state.operatorConfig = {
        name: parsed.name,
        phone: normalizePhone(parsed.phone),
      };
    }
    if (parsed.operatorChatId != null && state.operatorChatId == null) {
      state.operatorChatId = parsed.operatorChatId;
    }
  } catch {
    /* no config yet */
  }
}

async function persist() {
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
  // Re-binding required: a freshly configured operator must /start again.
  state.operatorChatId = null;
  await persist();
}

export async function clearOperator() {
  await ensureLoaded();
  state.operatorConfig = null;
  state.operatorChatId = null;
  await persist();
}

/**
 * Attempt to bind a Telegram chat as the operator.
 * If a phone is configured it must match the shared contact's phone.
 * Returns the bind outcome so the poller can message the user accordingly.
 */
export async function tryBindOperator(
  chatId: number,
  sharedPhone?: string,
): Promise<'bound' | 'need-contact' | 'phone-mismatch'> {
  await ensureLoaded();
  const cfg = state.operatorConfig;

  // No phone configured → first /start binds (open mode).
  if (!cfg || !cfg.phone) {
    state.operatorChatId = chatId;
    await persist();
    return 'bound';
  }

  if (!sharedPhone) return 'need-contact';

  if (normalizePhone(sharedPhone).endsWith(cfg.phone.slice(-9))) {
    state.operatorChatId = chatId;
    await persist();
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

/** Customer → operator. Returns whether it was actually relayed to Telegram. */
export async function forwardToOperator(
  sessionId: string,
  text: string,
  customerName?: string,
): Promise<{ relayed: boolean }> {
  await ensureLoaded();
  if (!BOT_TOKEN || state.operatorChatId == null) return { relayed: false };

  const session = getSession(sessionId);
  session.lastActivity = Date.now();
  if (customerName) session.customerName = customerName;

  const who = (customerName || session.customerName || 'Mijoz').slice(0, 40);
  const shortId = sessionId.slice(-6);
  const payload =
    `👤 *${who}*  \`#${shortId}\`\n\n${text}\n\n` +
    `↩️ _Javob berish uchun shu xabarga reply qiling._`;

  try {
    const r = await tg('sendMessage', {
      chat_id: state.operatorChatId,
      text: payload,
      parse_mode: 'Markdown',
    });
    if (r?.ok && r.result?.message_id) {
      state.forwarded.set(r.result.message_id, sessionId);
      return { relayed: true };
    }
  } catch {
    /* network hiccup — treated as not relayed, client falls back */
  }
  return { relayed: false };
}

/** Operator reply (from the Telegram poller) → stored for the website to poll. */
export function ingestOperatorReply(
  replyToMessageId: number,
  text: string,
): boolean {
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
  return true;
}

/** Operator messages newer than `since` (epoch ms). */
export function getMessagesSince(sessionId: string, since: number): RelayMessage[] {
  const s = state.sessions.get(sessionId);
  if (!s) return [];
  return s.messages.filter((m) => new Date(m.createdAt).getTime() > since);
}
