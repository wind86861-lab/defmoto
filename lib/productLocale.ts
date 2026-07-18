import type { Product } from '@/types/product';

/**
 * Localized product text. Base fields (name/description) are Uzbek; RU/EN live
 * in `tr` and fall back to the base text when a translation is missing — so a
 * half-translated product still renders.
 */
type Localizable = Pick<Product, 'name' | 'description' | 'tr'>;

export function productName(p: Localizable, locale: string): string {
  if (locale === 'ru' || locale === 'en') return p.tr?.[locale]?.name?.trim() || p.name;
  return p.name;
}

export function productDescription(p: Localizable, locale: string): string | undefined {
  if (locale === 'ru' || locale === 'en') return p.tr?.[locale]?.description?.trim() || p.description;
  return p.description;
}
