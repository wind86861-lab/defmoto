import type { Locale } from '@/i18n/config';

const currencyLabel: Record<Locale, string> = {
  uz: "so'm",
  ru: 'сум',
  en: 'UZS',
};

// Deterministic thousands grouping with a regular space —
// avoids Intl.NumberFormat divergence between Node and browser.
function groupThousands(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  return (
    sign +
    Math.abs(rounded)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  );
}

export function formatPrice(value: number, locale: Locale = 'uz'): string {
  return `${groupThousands(value)} ${currencyLabel[locale]}`;
}

export function formatNumber(value: number, _locale: Locale = 'uz'): string {
  return groupThousands(value);
}

export function formatCompact(value: number, _locale: Locale = 'uz'): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

const monthShort: Record<Locale, string[]> = {
  uz: ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek'],
  ru: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

// Uzbekistan is a fixed UTC+5 (Asia/Tashkent, no DST). Shift by the offset and
// read UTC parts so the output is BOTH correct local time AND deterministic
// (identical on server and browser — no hydration mismatch).
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
function tashkent(input: string | Date): Date {
  const d = typeof input === 'string' ? new Date(input) : input;
  return new Date(d.getTime() + TASHKENT_OFFSET_MS);
}

/** Deterministic short date (Tashkent) — same output on server and browser. */
export function formatDate(input: string | Date, locale: Locale = 'uz'): string {
  const d = tashkent(input);
  return `${d.getUTCDate()} ${monthShort[locale][d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Deterministic date-time (Tashkent). */
export function formatDateTime(input: string | Date, locale: Locale = 'uz'): string {
  const d = tashkent(input);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${formatDate(input, locale)}, ${hh}:${mm}`;
}
