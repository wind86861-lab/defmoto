export type Currency = 'UZS';

export interface CompetitorPrice {
  source: 'uzum' | 'wildberries' | 'yandex';
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

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  category: string;
  categorySlug: string;
  description?: string;
  images: string[];
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

export interface Category {
  id: string;
  slug: string;
  name: string;
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
