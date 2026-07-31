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
  | { ok: false; error: 'no-token' | 'no-channel' | 'not-found' | 'no-image' | 'send-failed' };

export async function postProductToChannel(productId: string): Promise<PostResult> {
  if (!BOT_TOKEN) return { ok: false, error: 'no-token' };

  const product = readProducts().find((p) => p.id === productId);
  if (!product) return { ok: false, error: 'not-found' };

  const { contact, marketplaces } = readSettings();
  const channel = (contact.channelId || process.env.TELEGRAM_CHANNEL_ID || '').trim();
  if (!channel) return { ok: false, error: 'no-channel' };

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

  try {
    // Single image → one photo post with the caption + inline buttons.
    if (images.length === 1) {
      const r = await tgApi<{ ok?: boolean }>('sendPhoto', {
        chat_id: channel,
        photo: images[0],
        caption,
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });
      return r?.ok ? { ok: true } : { ok: false, error: 'send-failed' };
    }

    // Multiple images → the album carries the product text (caption on the first
    // photo, so it reads as one post), then a compact follow-up holds the link
    // BUTTONS — Telegram albums can't carry an inline keyboard themselves.
    const media = images.map((url, i) =>
      i === 0 ? { type: 'photo', media: url, caption, parse_mode: 'HTML' } : { type: 'photo', media: url },
    );
    const album = await tgApi<{ ok?: boolean }>('sendMediaGroup', { chat_id: channel, media });
    if (!album?.ok) return { ok: false, error: 'send-failed' };
    if (keyboard) {
      await tgApi<{ ok?: boolean }>('sendMessage', {
        chat_id: channel,
        text: '🔗 Havolalar:',
        reply_markup: keyboard,
        disable_web_page_preview: true,
      });
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'send-failed' };
  }
}
