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

/** Coordinates for a branch — from lat/lng, or parsed out of a Google Maps URL. */
export function branchLatLng(b: {
  lat?: number;
  lng?: number;
  mapUrl?: string;
}): { lat: number; lng: number } | null {
  if (b.lat != null && b.lng != null) return { lat: b.lat, lng: b.lng };
  const raw = (b.mapUrl || '').trim();
  if (!raw) return null;
  let u = raw;
  try {
    u = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }
  const patterns = [
    /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/, // .../@lat,lng,17z
    /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/, // place URLs
    /[?&](?:q|ll|center|daddr)=(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/,
    /(-?\d{1,2}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})/, // any "lat,lng" fallback
  ];
  for (const re of patterns) {
    const m = u.match(re);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}

/** OpenStreetMap embed URL (no API key) with a marker at the coordinates. */
export function osmEmbed(lat: number, lng: number): string {
  const dLat = 0.006;
  const dLng = 0.01;
  const bbox = `${lng - dLng}%2C${lat - dLat}%2C${lng + dLng}%2C${lat + dLat}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}
