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

/** Localised category name with a safe fallback for admin-created categories. */
export function categoryName(
  t: (key: string) => string,
  category: Pick<Category, 'slug' | 'name'>,
): string {
  if (category.slug && I18N_SLUGS.has(category.slug)) return t(category.slug);
  return category.name || category.slug;
}
