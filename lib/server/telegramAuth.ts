/**
 * Telegram Mini App auto-login.
 *
 * When the app is opened inside Telegram, the client holds a signed `initData`
 * string. We validate its HMAC with the bot token (per Telegram's spec) to
 * prove the user's identity server-side, then issue a small signed cookie so
 * later requests (e.g. posting a review) can trust the user id without
 * re-validating every time. This closes the spoofing gap of trusting a
 * client-sent user id.
 */

import crypto from 'crypto';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const SECRET = process.env.ADMIN_SECRET || 'deftmoto-dev-secret';

export const TG_COOKIE = 'dm_tg';
export const TG_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface TgUser {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

/** Validate Telegram WebApp initData; returns the verified user or null. */
export function validateInitData(initData: string): TgUser | null {
  if (!BOT_TOKEN || !initData) return null;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return null;
  }
  const hash = params.get('hash');
  if (!hash) return null;

  const pairs: string[] = [];
  for (const [k, v] of params) {
    if (k === 'hash') continue;
    pairs.push(`${k}=${v}`);
  }
  pairs.sort();
  const dataCheckString = pairs.join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  // Optional freshness check (reject data older than 1 day).
  const authDate = Number(params.get('auth_date') || 0);
  if (authDate && Date.now() / 1000 - authDate > 86400) return null;

  try {
    const user = JSON.parse(params.get('user') || 'null');
    if (!user?.id) return null;
    return {
      id: String(user.id),
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      photo_url: user.photo_url,
    };
  } catch {
    return null;
  }
}

/* ------------------------- signed session cookie ------------------------- */

function sign(uid: string): string {
  return crypto.createHmac('sha256', SECRET).update(uid).digest('hex').slice(0, 32);
}

export function makeTgCookie(uid: string): string {
  return `${uid}.${sign(uid)}`;
}

/** Read + verify the Telegram session cookie; returns the user id or null. */
export function verifiedTelegramUserId(req: Request): string | null {
  const cookie = req.headers.get('cookie') || '';
  const m = cookie.match(new RegExp(`${TG_COOKIE}=([^;]+)`));
  if (!m) return null;
  const raw = decodeURIComponent(m[1]);
  const dot = raw.lastIndexOf('.');
  if (dot < 0) return null;
  const uid = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!uid || sign(uid) !== sig) return null;
  return uid;
}
