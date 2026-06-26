/**
 * Service-chat relay store (server-side, in-memory).
 *
 * Bridges the website chat with a live operator on Telegram:
 *  - customer message  →  forwardToOperator()  →  Telegram DM to the operator
 *  - operator replies in Telegram (reply-to the message)  →  ingestOperatorReply()
 *  - website polls getMessagesSince() to pull the operator's answers
 *
 * State lives on globalThis so it survives Next.js dev module reloads and is
 * shared between the API routes and the Telegram poller (single pm2 instance).
 * It resets on a full server restart — fine for an MVP support relay.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ENV_OPERATOR = process.env.TELEGRAM_OPERATOR_CHAT_ID || '';

export interface RelayMessage {
  id: string;
  author: 'operator';
  text: string;
  createdAt: string;
}

interface Session {
  messages: RelayMessage[];
  lastActivity: number;
  customerName?: string;
}

interface RelayState {
  operatorChatId: number | null;
  sessions: Map<string, Session>;
  forwarded: Map<number, string>; // telegram message_id -> sessionId
}

const globalRef = globalThis as unknown as { __deftChatRelay?: RelayState };

const state: RelayState =
  globalRef.__deftChatRelay ??
  (globalRef.__deftChatRelay = {
    operatorChatId: ENV_OPERATOR ? Number(ENV_OPERATOR) : null,
    sessions: new Map(),
    forwarded: new Map(),
  });

export function isRelayConfigured(): boolean {
  return Boolean(BOT_TOKEN);
}

export function isOperatorConnected(): boolean {
  return state.operatorChatId != null;
}

export function getOperatorChatId(): number | null {
  return state.operatorChatId;
}

export function setOperatorChatId(id: number): void {
  state.operatorChatId = id;
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
