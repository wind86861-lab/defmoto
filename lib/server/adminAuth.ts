/**
 * Server-side admin authentication — a signed, httpOnly session cookie.
 * Replaces the previous client-only password gate so the admin APIs are
 * actually protected. Password + signing secret come from env (with dev
 * fallbacks so the demo keeps working).
 */

import crypto from 'crypto';

export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'deftmoto2026';
const SECRET = process.env.ADMIN_SECRET || 'deftmoto-insecure-dev-secret-change-me';

export const ADMIN_COOKIE = 'dm_admin';
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Constant-time string equality that doesn't leak length via short-circuit. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    crypto.timingSafeEqual(ab, ab); // keep timing uniform
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

export function checkPassword(password: string): boolean {
  if (typeof password !== 'string' || password.length === 0) return false;
  return safeEqual(password, ADMIN_PASSWORD);
}

/** Verify the admin username (case-insensitive) AND password. */
export function checkCredentials(username: string, password: string): boolean {
  if (typeof username !== 'string' || typeof password !== 'string') return false;
  const userOk = safeEqual(username.trim().toLowerCase(), ADMIN_USERNAME.trim().toLowerCase());
  return userOk && checkPassword(password);
}

export function makeSessionToken(): string {
  const exp = Date.now() + ADMIN_COOKIE_MAX_AGE * 1000;
  const sig = crypto.createHmac('sha256', SECRET).update(String(exp)).digest('hex');
  return `${exp}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig) return false;
  const expected = crypto.createHmac('sha256', SECRET).update(exp).digest('hex');
  const ok =
    sig.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  return ok && Number(exp) > Date.now();
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

/** True if the request carries a valid admin session cookie. */
export function isAdminRequest(req: Request): boolean {
  return verifySessionToken(readCookie(req, ADMIN_COOKIE));
}
