/**
 * Phone + password auth for the website (used outside the Telegram Mini App).
 * Passwords are scrypt-hashed; the session is a small signed cookie. Password
 * reset codes are delivered through the Telegram bot (see the poller).
 */

import crypto from 'crypto';
import { verifiedTelegramUserId } from './telegramAuth';

const SECRET = process.env.ADMIN_SECRET || 'deftmoto-dev-secret';

export const USER_COOKIE = 'dm_user';
export const USER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/* ------------------------------- passwords ------------------------------- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = (stored || '').split(':');
  if (!salt || !hash) return false;
  const computed = crypto.scryptSync(password, salt, 64);
  const a = Buffer.from(hash, 'hex');
  return a.length === computed.length && crypto.timingSafeEqual(a, computed);
}

/* ----------------------------- session cookie ---------------------------- */

function sign(uid: string): string {
  return crypto.createHmac('sha256', SECRET).update(`user:${uid}`).digest('hex').slice(0, 32);
}

export function makeUserCookie(uid: string): string {
  return `${uid}.${sign(uid)}`;
}

export function verifiedUserAccountId(req: Request): string | null {
  const cookie = req.headers.get('cookie') || '';
  const m = cookie.match(new RegExp(`${USER_COOKIE}=([^;]+)`));
  if (!m) return null;
  const raw = decodeURIComponent(m[1]);
  const dot = raw.lastIndexOf('.');
  if (dot < 0) return null;
  const uid = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!uid || sign(uid) !== sig) return null;
  return uid;
}

/**
 * The current user id for gating (reviews, orders): the phone-login account id,
 * or the verified Telegram id when opened inside the Mini App.
 */
export function currentUserId(req: Request): string | null {
  return verifiedUserAccountId(req) || verifiedTelegramUserId(req);
}

/* -------------------------- password reset store ------------------------- */

interface ResetEntry {
  phone: string; // normalized digits
  code: string; // 6 digits
  expires: number;
  verified: boolean; // set once the phone owner confirmed via the bot
}

const globalRef = globalThis as unknown as { __deftResets?: Map<string, ResetEntry> };
const resets: Map<string, ResetEntry> =
  globalRef.__deftResets ?? (globalRef.__deftResets = new Map());

export function normalizePhone(raw: string): string {
  return (raw || '').replace(/\D/g, '');
}

/** Create a reset request. Returns the token to embed in the bot deep link. */
export function createReset(phone: string): { token: string; code: string } {
  const token = crypto.randomBytes(16).toString('hex');
  const code = String(Math.floor(100000 + Math.random() * 900000));
  resets.set(token, {
    phone: normalizePhone(phone),
    code,
    expires: Date.now() + 15 * 60 * 1000,
    verified: false,
  });
  // Garbage-collect expired entries.
  for (const [k, v] of resets) if (v.expires < Date.now()) resets.delete(k);
  return { token, code };
}

export function getReset(token: string): ResetEntry | null {
  const r = resets.get(token);
  if (!r) return null;
  if (r.expires < Date.now()) {
    resets.delete(token);
    return null;
  }
  return r;
}

/** Called by the bot once the phone owner shared a matching contact. */
export function markResetVerified(token: string): boolean {
  const r = getReset(token);
  if (!r) return false;
  r.verified = true;
  return true;
}

/** Consume a reset after the user enters the code on the site. */
export function consumeReset(token: string, code: string): { phone: string } | null {
  const r = getReset(token);
  if (!r || !r.verified || r.code !== code) return null;
  resets.delete(token);
  return { phone: r.phone };
}
