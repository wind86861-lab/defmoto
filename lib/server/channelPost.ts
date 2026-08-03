/**
 * Post a product to the admin's Telegram channel as a rich photo card.
 *
 * The channel id (@username or -100… id) comes from the admin site-settings
 * (contact.channelId) with a TELEGRAM_CHANNEL_ID env fallback. The bot must be
 * an admin of the channel. Everything is read from the persisted stores so this
 * works from a plain API call with no client state.
 */
import { promises as fs } from 'fs';
import path from 'path';
import https from 'node:https';
import { getContent } from '@/lib/db';
import { tgApi, tgUpload, type TgFilePart } from './tgFetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

const IMG_CONTENT_TYPE: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

/** Read an image's bytes: from local /uploads on disk, else fetch over IPv4. */
async function readImageBytes(src: string): Promise<TgFilePart | null> {
  try {
    const ext = (src.split('?')[0].split('.').pop() || 'jpg').toLowerCase();
    const contentType = IMG_CONTENT_TYPE[ext] || 'image/jpeg';
    const uploadsIdx = src.indexOf('/uploads/');
    if (uploadsIdx >= 0) {
      const name = path.basename(src.slice(uploadsIdx + '/uploads/'.length).split('?')[0]);
      const buffer = await fs.readFile(path.join(process.cwd(), 'public', 'uploads', name));
      return { field: '', filename: name, buffer, contentType };
    }
    if (/^https?:\/\//i.test(src)) {
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        https
          .get(src, { family: 4, timeout: 20_000 }, (res) => {
            if ((res.statusCode || 0) >= 400) {
              res.resume();
              reject(new Error(`HTTP ${res.statusCode}`));
              return;
            }
            const parts: Buffer[] = [];
            res.on('data', (c: Buffer) => parts.push(c));
            res.on('end', () => resolve(Buffer.concat(parts)));
          })
          .on('error', reject)
          .on('timeout', function (this: import('http').ClientRequest) {
            this.destroy(new Error('timeout'));
          });
      });
      return { field: '', filename: `img.${ext}`, buffer, contentType };
    }
    return null;
  } catch {
    return null;
  }
}

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
  channelPostMode?: string;
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

/**
 * Fit an HTML caption within `max` chars without leaving a half-cut tag or
 * entity — Telegram rejects "unclosed start tag" / "can't parse entities".
 * Tags live on whole lines here, so we drop whole ▫️ description lines first
 * (never splitting a tag), then hard-trim any dangling `<…`/`&…` as a last resort.
 */
function fitCaption(allLines: string[], max = 1024): string {
  const lines = [...allLines];
  const joined = () => lines.join('\n');
  while (joined().length > max) {
    const i = lines.map((l) => l.trimStart().startsWith('▫️')).lastIndexOf(true);
    if (i === -1) break;
    lines.splice(i, 1);
  }
  let out = joined();
  if (out.length > max) {
    out = out.slice(0, max);
    const lt = out.lastIndexOf('<');
    const gt = out.lastIndexOf('>');
    if (lt > gt) out = out.slice(0, lt); // drop a partial tag
    const amp = out.lastIndexOf('&');
    const semi = out.lastIndexOf(';');
    if (amp > semi && out.length - amp <= 10) out = out.slice(0, amp); // partial entity
  }
  return out.trimEnd();
}

function fullUrl(src?: string): string | null {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('/') && APP_URL) return `${APP_URL}${src}`;
  return null;
}

/**
 * Extract a clean handle from anything the admin pasted — a bare @username, a
 * full profile URL, or a share URL with tracking params
 * (e.g. "https://www.instagram.com/deft.moto?utm_source=…&igsh=…" → "deft.moto").
 * `host` strips the known domain prefix; query/hash/path tail is dropped.
 */
function cleanHandle(raw?: string, host?: RegExp): string {
  let s = (raw || '').trim();
  if (!s) return '';
  s = s.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  if (host) s = s.replace(host, '');
  return s.replace(/^@/, '').split(/[/?#]/)[0].trim();
}

const TG_HOST = /^(t\.me|telegram\.me|telegram\.dog)\//i;
const IG_HOST = /^(instagram\.com|instagr\.am)\//i;

function tgHref(handle?: string): string | null {
  const u = cleanHandle(handle, TG_HOST);
  return u ? `https://t.me/${u}` : null;
}

function igHref(handle?: string): string | null {
  const u = cleanHandle(handle, IG_HOST);
  return u ? `https://instagram.com/${u}` : null;
}

/**
 * A recognisable icon per marketplace. Telegram inline buttons can only carry
 * unicode (no brand logos), so we pick the closest emoji — Uzum ("uzum" =
 * grape) → 🍇, Wildberries (wild berry) → 🫐, otherwise a generic cart.
 */
function marketIcon(id?: string): string {
  const s = (id || '').toLowerCase();
  // Colour-matched to each brand (a real logo can't go on a Telegram button —
  // buttons hold text only — so we echo the brand colour with a unicode glyph):
  if (s.includes('uzum')) return '🟪'; // Uzum's purple square
  if (s.includes('wildber') || s === 'wb') return '🟪'; // Wildberries purple
  if (s.includes('yandex')) return '🟥'; // Yandex red
  return '🛒';
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
  // Minimalist / monochrome styling: thin unicode marks instead of colourful
  // emoji for a premium, editorial look.
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

  lines.push('');
  if (contact.phone) lines.push(`📞 ${esc(contact.phone)}`);
  // Social handles render as clean, tappable links (never the raw share URL).
  const tgU = cleanHandle(contact.telegram, TG_HOST);
  const tgH = tgHref(contact.telegram);
  if (tgU && tgH) lines.push(`✈️ <a href="${esc(tgH)}">@${esc(tgU)}</a>`);
  const igU = cleanHandle(contact.instagram, IG_HOST);
  const igH = igHref(contact.instagram);
  if (igU && igH) lines.push(`📸 <a href="${esc(igH)}">@${esc(igU)}</a>`);

  const caption = fitCaption(lines);

  // ---- links (one source of truth) ----
  // Only the marketplaces THIS product is listed on — its competitor links.
  const links: { label: string; url: string }[] = [];
  if (APP_URL && product.slug) links.push({ label: '🏍 DEFT MOTO', url: `${APP_URL}/product/${product.slug}` });
  for (const c of product.competitorPrices || []) {
    if (!c.url) continue;
    const mk = marketplaces.find((m) => m.id === c.source);
    links.push({ label: `${marketIcon(mk?.id || c.source)} ${mk?.name || mk?.label || c.label || c.source || 'Market'}`, url: c.url });
  }
  const dm = tgHref(contact.telegram);
  if (dm) links.push({ label: '✈️ Telegramdan yozish', url: dm });
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

  // Admin-chosen post layout (Telegram can't do multi-image + buttons in one
  // message):
  //   'single' — 1 photo + caption + attached buttons (default)
  //   'album'  — one album of all images; links as tappable HTML text (no buttons)
  const mode = (contact.channelPostMode || 'single') as 'single' | 'album';

  const readAll = async (srcs: string[]): Promise<TgFilePart[]> => {
    const parts: TgFilePart[] = [];
    for (const src of srcs) {
      const f = await readImageBytes(src);
      if (f) parts.push({ ...f, field: `file${parts.length}` });
    }
    return parts;
  };

  try {
    // 'album' → one grouped album of all images, links as tappable HTML text.
    if (mode === 'album' && images.length > 1) {
      const parts = await readAll(images.slice(0, 10));
      if (parts.length >= 2) {
        // esc() the href too — URLs with & (e.g. Instagram ?utm=…&igsh=…) break
        // HTML parsing otherwise ("can't parse entities").
        const linkLines = links.length
          ? ['', '🔗 <b>Havolalar</b>', ...links.map((l) => `<a href="${esc(l.url)}">${esc(l.label)}</a>`)]
          : [];
        const albumCaption = fitCaption([...lines, ...linkLines]);
        const mediaJson = parts.map((p, i) =>
          i === 0
            ? { type: 'photo', media: `attach://${p.field}`, caption: albumCaption, parse_mode: 'HTML' }
            : { type: 'photo', media: `attach://${p.field}` },
        );
        const r = await tgUpload<{ ok?: boolean; description?: string; parameters?: { retry_after?: number } }>(
          'sendMediaGroup',
          { chat_id: channel, media: JSON.stringify(mediaJson) },
          parts,
          { timeoutMs: MEDIA_TIMEOUT_MS },
        );
        return r?.ok ? { ok: true } : fail(r);
      }
      // <2 readable images → fall through to single.
    }

    // 'single' (default) → one photo + caption + attached buttons.
    const main = await tgApi<{ ok?: boolean; description?: string; parameters?: { retry_after?: number } }>(
      'sendPhoto',
      { chat_id: channel, photo: images[0], caption, parse_mode: 'HTML', reply_markup: keyboard },
      { timeoutMs: MEDIA_TIMEOUT_MS },
    );
    if (!main?.ok) return fail(main);
    return { ok: true };
  } catch (e) {
    recentPosts.delete(dedupeKey);
    return { ok: false, error: 'send-failed', detail: (e as Error)?.message };
  }
}
