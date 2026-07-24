import type { Category } from '@/types/product';

/**
 * Slugs of the built-in categories that have uz/ru/en translations in the
 * `categories` i18n namespace. Admin-created categories use a custom slug that
 * isn't translated, so we fall back to the stored `name`.
 */
const I18N_SLUGS = new Set([
  'motorcycles',
  'cruisers',
  'scooters',
  'sportbikes',
  'naked',
  'helmets',
  'gear',
  'parts',
  'accessories',
  'oils',
  'tires',
  'engines',
  'electronics',
  'tuning',
]);

/**
 * Localised category name.
 *  - Built-in categories (known slug) use the `categories` i18n namespace,
 *    already bound to the active locale via `t`.
 *  - Admin-created categories use the admin-entered RU/EN translation when the
 *    locale is ru/en, falling back to the base (Uzbek) `name` — so a
 *    half-translated category still renders.
 */
export function categoryName(
  t: (key: string) => string,
  category: Pick<Category, 'slug' | 'name' | 'tr'>,
  locale?: string,
): string {
  if (category.slug && I18N_SLUGS.has(category.slug)) return t(category.slug);
  if (locale === 'ru' || locale === 'en') {
    const tr = category.tr?.[locale]?.name?.trim();
    if (tr) return tr;
  }
  return category.name || category.slug;
}
