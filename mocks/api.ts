import type { Product } from '@/types/product';
import { mockProducts } from './products';
import { mockCategories } from './categories';

export type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'newest' | 'rating';

export interface ProductQuery {
  category?: string;
  brands?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: SortKey;
  query?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  facets: {
    priceMin: number;
    priceMax: number;
    brands: { slug: string; name: string; count: number }[];
    colors: { hex: string; name: string; count: number }[];
  };
}

const sortFns: Record<SortKey, (a: Product, b: Product) => number> = {
  popular: (a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  newest: (a, b) => Number(b.isNew) - Number(a.isNew),
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
};

export function queryProducts(
  q: ProductQuery = {},
  source: Product[] = mockProducts,
): ProductListResponse {
  const {
    category,
    brands = [],
    colors = [],
    minPrice,
    maxPrice,
    inStockOnly,
    sort = 'popular',
    query,
    page = 1,
    pageSize = 12,
  } = q;

  let items = [...source];

  if (category) {
    items = items.filter((p) => p.categorySlug === category);
  }
  if (brands.length) {
    const set = new Set(brands.map((b) => b.trim().toLowerCase()));
    items = items.filter((p) => p.brand && set.has(p.brand.trim().toLowerCase()));
  }
  if (colors.length) {
    const set = new Set(colors.map((c) => c.toLowerCase()));
    items = items.filter((p) =>
      p.variants?.some((v) => v.colorHex && set.has(v.colorHex.toLowerCase())),
    );
  }
  if (typeof minPrice === 'number') {
    items = items.filter((p) => p.price >= minPrice);
  }
  if (typeof maxPrice === 'number') {
    items = items.filter((p) => p.price <= maxPrice);
  }
  if (inStockOnly) {
    items = items.filter((p) => p.inStock);
  }
  if (query?.trim()) {
    const q = query.trim().toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }

  items.sort(sortFns[sort]);

  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  // Facets — based on full (filtered) set, so user can refine further
  const allPrices = source.map((p) => p.price);
  const brandCounts = new Map<string, number>();
  const colorCounts = new Map<string, { hex: string; name: string; count: number }>();

  for (const p of source) {
    const brand = p.brand?.trim();
    if (brand) {
      brandCounts.set(brand, (brandCounts.get(brand) ?? 0) + 1);
    }
    for (const v of p.variants ?? []) {
      if (v.colorHex && v.color) {
        const key = v.colorHex.toLowerCase();
        const existing = colorCounts.get(key);
        if (existing) existing.count += 1;
        else colorCounts.set(key, { hex: v.colorHex, name: v.color, count: 1 });
      }
    }
  }

  // Brands derived from the actual products (the brand name is also the filter
  // value — /catalog?brands= matches p.brand case-insensitively). Most first.
  const brandFacets = Array.from(brandCounts.entries())
    .map(([name, count]) => ({ slug: name, name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    items: paged,
    total,
    page,
    pageSize,
    hasMore: start + pageSize < total,
    facets: {
      // Guard against an empty set (Math.min/max of [] → ±Infinity breaks the slider).
      priceMin: allPrices.length ? Math.min(...allPrices) : 0,
      priceMax: allPrices.length ? Math.max(...allPrices) : 0,
      brands: brandFacets,
      colors: Array.from(colorCounts.values()),
    },
  };
}

export function searchProductsInstant(query: string, limit = 6): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return mockProducts
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    )
    .slice(0, limit);
}

export function getCategoryBySlug(slug: string) {
  return mockCategories.find((c) => c.slug === slug);
}

export function getProductBySlug(slug: string) {
  return mockProducts.find((p) => p.slug === slug);
}
