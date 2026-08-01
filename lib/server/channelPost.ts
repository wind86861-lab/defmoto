/**
 * Post a product to the admin's Telegram channel as a rich photo card.
 *
 * The channel id (@username or -100… id) comes from the admin site-settings
 * (contact.channelId) with a TELEGRAM_CHANNEL_ID env fallback. The bot must be
 * an admin of the channel. Everything is read from the persisted stores so this
 * works from a plain API call with no client state.
 */
import { getContent } from '@/lib/db';
import { tgApi } from './tgFetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

interface CompetitorLite {
  source: string; // marketplace id (from settings) or free label
  label?: string;
  url?: string;
  price?: number;
}

interface ProductLite {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  oldPrice?: number;
  brand?: string;
  images?: string[];
  videoUrl?: string;
  competitorPrices?: CompetitorLite[];
}

interface MarketplaceLite {
  id: string;
  name: string;
  label?: string;
  url: string;
  enabled?: boolean;
}

interface ContactLite {
  phone?: string;
  telegram?: string;
  instagram?: string;
  channelId?: string;
}

function readProducts(): ProductLite[] {
  const blob = getContent<{ state?: { products?: ProductLite[] } } | null>('content-store', null);
  return blob?.state?.products || [];
}

function readSettings(): { contact: ContactLite; marketplaces: MarketplaceLite[] } {
  const blob = getContent<{
    state?: { contact?: ContactLite; marketplaces?: MarketplaceLite[] };
  } | null>('site-settings', null);
  return {
    contact: blob?.state?.contact || {},
    marketplaces: blob?.state?.marketplaces || [],
  };
}

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
const sum = (n: number) => (n || 0).toLocaleString('ru-RU');
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function fullUrl(src?: string): string | null {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('/') && APP_URL) return `${APP_URL}${src}`;
  return null;
}

function tgHref(handle?: string): string | null {
  const s = (handle || '').trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://t.me/${s.replace(/^@/, '')}`;
}

function igHref(handle?: string): string | null {
  const s = (handle || '').trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://instagram.com/${s.replace(/^@/, '')}`;
}

type UrlBtn = { text: string; url: string };

export type PostResult =
  | { ok: true }
  | {
      ok: false;
      error: 'no-token' | 'no-channel' | 'not-found' | 'no-image' | 'send-failed';
      detail?: string;
    };

// Telegram fetches every image URL itself, which can take a while for an album,
// so media sends get a generous timeout (kept under nginx's 60s proxy limit).
const MEDIA_TIMEOUT_MS = 50_000;

// Guard against a double-click / double-submit posting the same product twice
// in quick succession (which showed up as two identical posts in the channel).
const recentPosts = new Map<string, number>();
const DEDUPE_MS = 10_000;

export async function postProductToChannel(productId: string): Promise<PostResult> {
  if (!BOT_TOKEN) return { ok: false, error: 'no-token' };

  const product = readProducts().find((p) => p.id === productId);
  if (!product) return { ok: false, error: 'not-found' };

  const { contact, marketplaces } = readSettings();
  const channel = (contact.channelId || process.env.TELEGRAM_CHANNEL_ID || '').trim();
  if (!channel) return { ok: false, error: 'no-channel' };

  // Rapid duplicate → treat as success without re-sending.
  const dedupeKey = `${channel}:${productId}`;
  const now = Date.now();
  const last = recentPosts.get(dedupeKey);
  if (last && now - last < DEDUPE_MS) return { ok: true };
  recentPosts.set(dedupeKey, now);
  // Prune old entries so the map can't grow unbounded.
  for (const [k, t] of recentPosts) if (now - t > DEDUPE_MS) recentPosts.delete(k);

  // All product images (Telegram albums allow up to 10).
  const images = (product.images || [])
    .map((s) => fullUrl(s))
    .filter((u): u is string => Boolean(u))
    .slice(0, 10);
  if (!images.length) return { ok: false, error: 'no-image' };

  // ---- caption (HTML) ----
  const lines: string[] = [`🏍 <b>${esc(product.name)}</b>`];
  if (product.brand) lines.push(`🏷 ${esc(product.brand)}`);

  const descLines = (product.description || '')
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8);
  if (descLines.length) {
    lines.push('');
    for (const l of descLines) lines.push(`▫️ ${esc(l)}`);
  }

  lines.push('');
  const priceLine =
    product.oldPrice && product.oldPrice > product.price
      ? `💰 <b>${sum(product.price)} so'm</b>  <s>${sum(product.oldPrice)} so'm</s>`
      : `💰 <b>${sum(product.price)} so'm</b>`;
  lines.push(priceLine);

  if (contact.phone) lines.push(`📞 ${esc(contact.phone)}`);
  const tgUser = contact.telegram?.replace(/^https?:\/\/t\.me\//i, '').replace(/^@/, '');
  if (tgUser) lines.push(`✈️ @${esc(tgUser)}`);
  const igUser = contact.instagram?.replace(/^@/, '');
  if (igUser) lines.push(`📸 ${esc(igUser)}`);

  const caption = lines.join('\n').slice(0, 1024);

  // ---- links (one source of truth) ----
  // Only the marketplaces THIS product is listed on — its competitor links.
  const links: { label: string; url: string }[] = [];
  if (APP_URL && product.slug) links.push({ label: '🛍 DEFT MOTO', url: `${APP_URL}/product/${product.slug}` });
  for (const c of product.competitorPrices || []) {
    if (!c.url) continue;
    const mk = marketplaces.find((m) => m.id === c.source);
    links.push({ label: `🛒 ${mk?.name || mk?.label || c.label || c.source || 'Market'}`, url: c.url });
  }
  const dm = tgHref(contact.telegram);
  if (dm) links.push({ label: '💬 Telegramdan yozish', url: dm });
  const video = fullUrl(product.videoUrl) || (product.videoUrl?.startsWith('http') ? product.videoUrl : null);
  if (video) links.push({ label: '▶️ Videoni koʻrish', url: video });
  const ig = igHref(contact.instagram);
  if (ig) links.push({ label: '📸 Instagram', url: ig });

  // Links as inline buttons (2 per row).
  const buttonRows: UrlBtn[][] = [];
  for (let i = 0; i < links.length; i += 2) {
    buttonRows.push(links.slice(i, i + 2).map((l) => ({ text: l.label, url: l.url })));
  }
  const keyboard = buttonRows.length ? { inline_keyboard: buttonRows } : undefined;

  const fail = (r: { description?: string; parameters?: { retry_after?: number } }): PostResult => {
    // Surface Telegram's reason so the admin knows what to fix (e.g.
    // "CHAT_ADMIN_REQUIRED", "chat not found", "WEBPAGE_MEDIA_EMPTY").
    recentPosts.delete(dedupeKey); // allow an immediate retry after a failure
    const retry = r?.parameters?.retry_after;
    const detail = retry ? `Juda tez — ${retry}s dan keyin urinib koʻring.` : r?.description;
    return { ok: false, error: 'send-failed', detail };
  };

  try {
    // ONE post: main image + caption + inline buttons — the format the admin
    // approved. Telegram does NOT allow inline buttons on a multi-photo album,
    // so attaching the link buttons requires a single-photo message. The extra
    // images are reachable via the "DEFT MOTO" button (full gallery on the site).
    const r = await tgApi<{ ok?: boolean; description?: string; parameters?: { retry_after?: number } }>(
      'sendPhoto',
      { chat_id: channel, photo: images[0], caption, parse_mode: 'HTML', reply_markup: keyboard },
      { timeoutMs: MEDIA_TIMEOUT_MS },
    );
    return r?.ok ? { ok: true } : fail(r);
  } catch (e) {
    recentPosts.delete(dedupeKey);
    return { ok: false, error: 'send-failed', detail: (e as Error)?.message };
  }
}
