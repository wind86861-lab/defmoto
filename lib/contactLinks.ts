/** Normalise a Telegram handle/link into a full https://t.me/... URL. */
export function telegramHref(v?: string): string | null {
  if (!v) return null;
  const s = v.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://t.me/${s.replace(/^@/, '')}`;
}

/** Display text for a Telegram handle (always @-prefixed unless a full link). */
export function telegramLabel(v?: string): string {
  const s = (v ?? '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s.replace(/^https?:\/\/(t\.me\/)?/i, '@');
  return s.startsWith('@') ? s : `@${s}`;
}

/** Google Maps link — the explicit mapUrl, or derived from lat/lng. */
export function mapsHref(b: { mapUrl?: string; lat?: number; lng?: number }): string | null {
  if (b.mapUrl && b.mapUrl.trim()) return b.mapUrl.trim();
  if (b.lat != null && b.lng != null) return `https://www.google.com/maps?q=${b.lat},${b.lng}`;
  return null;
}
