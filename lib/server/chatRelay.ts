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

export async function tryBindOperator(
  chatId: number,
  sharedPhone?: string,
): Promise<'bound' | 'need-contact' | 'phone-mismatch'> {
  await ensureLoaded();
  const cfg = state.operatorConfig;
  if (!cfg || !cfg.phone) {
    state.operatorChatId = chatId;
    await persistConfig();
    return 'bound';
  }
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
    `↩️ _Javob berish uchun shu xabarga reply qiling._`;

  try {
    const r = await tg('sendMessage', {
      chat_id: state.operatorChatId,
      text: payload,
      parse_mode: 'Markdown',
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
