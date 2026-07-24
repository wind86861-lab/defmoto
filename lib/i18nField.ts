/**
 * Generic per-record translations for admin-entered content.
 *
 * Base fields on every record are Uzbek (what the admin types first). RU/EN
 * live in a `tr` map keyed by locale → field name, and always fall back to the
 * base text when a translation is missing — so a half-translated record still
 * renders instead of going blank.
 *
 * Only content text is translated. Language-neutral fields (phone, map links,
 * images, prices, dates, coordinates) stay single-value by design.
 */

export type TrLocale = 'ru' | 'en';

/** locale → { fieldName: translated text } */
export type TrMap = Partial<Record<TrLocale, Record<string, string | undefined>>>;

/** Anything carrying per-record translations. */
export interface Translatable {
  tr?: TrMap;
}

function isTrLocale(locale: string): locale is TrLocale {
  return locale === 'ru' || locale === 'en';
}

/** Localized value of `field`, falling back to `base` (the Uzbek text). */
export function trText(
  base: string | undefined,
  tr: TrMap | undefined,
  field: string,
  locale: string,
): string {
  if (isTrLocale(locale)) {
    const v = tr?.[locale]?.[field];
    if (v && v.trim()) return v.trim();
  }
  return base ?? '';
}

/** Localized field read straight off a record: `trOf(post, 'title', locale)`. */
export function trOf<T extends Translatable>(
  record: T,
  field: Extract<keyof T, string>,
  locale: string,
): string {
  return trText(record[field] as unknown as string | undefined, record.tr, field, locale);
}

/** Immutably set one translated field — for admin form onChange handlers. */
export function setTr(
  tr: TrMap | undefined,
  locale: TrLocale,
  field: string,
  value: string,
): TrMap {
  return { ...tr, [locale]: { ...tr?.[locale], [field]: value } };
}
