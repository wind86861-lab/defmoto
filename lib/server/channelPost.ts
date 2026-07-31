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
}

interface MarketplaceLite {
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

  const photo = fullUrl(product.images?.[0]);
  if (!photo) return { ok: false, error: 'no-image' };

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

  // ---- inline buttons (url only — channels don't allow web_app) ----
  const rows: UrlBtn[][] = [];
  if (APP_URL && product.slug) {
    rows.push([{ text: '🛍 DEFT MOTO', url: `${APP_URL}/product/${product.slug}` }]);
  }
  const mkBtns = marketplaces
    .filter((m) => m.enabled !== false && m.url)
    .map((m) => ({ text: `🛒 ${m.name || m.label || 'Market'}`, url: m.url }));
  for (let i = 0; i < mkBtns.length; i += 2) rows.push(mkBtns.slice(i, i + 2));

  const dm = tgHref(contact.telegram);
  const video = fullUrl(product.videoUrl) || (product.videoUrl?.startsWith('http') ? product.videoUrl : null);
  const lastRow: UrlBtn[] = [];
  if (dm) lastRow.push({ text: '💬 Telegramdan yozish', url: dm });
  if (video) lastRow.push({ text: '▶️ Videoni koʻrish', url: video });
  if (lastRow.length) rows.push(lastRow);

  const ig = igHref(contact.instagram);
  if (ig) rows.push([{ text: '📸 Instagram', url: ig }]);

  try {
    const r = await tgApi<{ ok?: boolean; description?: string }>('sendPhoto', {
      chat_id: channel,
      photo,
      caption,
      parse_mode: 'HTML',
      reply_markup: rows.length ? { inline_keyboard: rows } : undefined,
    });
    if (r?.ok) return { ok: true };
    return { ok: false, error: 'send-failed' };
  } catch {
    return { ok: false, error: 'send-failed' };
  }
}
