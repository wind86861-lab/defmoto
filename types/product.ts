export type Currency = 'UZS';

export interface CompetitorPrice {
  source: string; // marketplace id (from site settings) or free label
  label?: string; // short badge text, e.g. "Uzum"
  color?: string; // brand colour for the chip
  price: number;
  url?: string;
}

export interface ProductVariant {
  id: string;
  color?: string;
  colorHex?: string;
  size?: string;
  stock: number;
}

/** Per-locale overrides for translatable product text (uz lives on the base fields). */
export interface ProductTranslations {
  ru?: { name?: string; description?: string };
  en?: { name?: string; description?: string };
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  category: string;
  categorySlug: string;
  description?: string;
  /** RU/EN translations — display falls back to the base (uz) text. */
  tr?: ProductTranslations;
  images: string[];
  video?: string; // uploaded /uploads/*.mp4 or a video/YouTube URL
  weight?: number; // kg — used for BTS delivery price
  price: number;
  oldPrice?: number;
  currency: Currency;
  competitorPrices?: CompetitorPrice[];
  variants?: ProductVariant[];
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  badges?: string[];
}

/** Admin-entered RU/EN translations for a category name (base name is Uzbek). */
export interface CategoryTranslations {
  ru?: { name?: string };
  en?: { name?: string };
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  tr?: CategoryTranslations;
  icon?: string;
  image?: string;
  productCount?: number;
  children?: Category[];
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  logo?: string;
}
