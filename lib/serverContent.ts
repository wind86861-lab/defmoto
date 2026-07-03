/**
 * Server-side reads of admin-managed content (products, categories) straight
 * from the DB, so server-rendered pages (product detail) reflect admin edits
 * and admin-created items — falling back to the mock seed when nothing has
 * been saved yet.
 *
 * The content store is persisted as a whole zustand blob (`{ state, version }`)
 * under the `content-store` key; we read that and extract the slices.
 */

import { getContent, hasContent } from '@/lib/db';
import { mockProducts } from '@/mocks/products';
import { mockCategories } from '@/mocks/categories';
import type { Product, Category } from '@/types/product';

interface ContentState {
  products?: Product[];
  categories?: Category[];
}

function contentState(): ContentState | null {
  const blob = getContent<{ state?: ContentState } | null>('content-store', null);
  return blob?.state ?? null;
}

// Once the admin has saved content at least once, that store is the source of
// truth — even an empty list (the admin deleted everything). The mock seed is
// only used on a truly fresh install where nothing has ever been saved.
const seeded = () => hasContent('content-store');

export function getProductsServer(): Product[] {
  const p = contentState()?.products;
  if (Array.isArray(p) && (p.length || seeded())) return p;
  return mockProducts;
}

export function getProductBySlugServer(slug: string): Product | undefined {
  return getProductsServer().find((p) => p.slug === slug);
}

export function getCategoriesServer(): Category[] {
  const c = contentState()?.categories;
  if (Array.isArray(c) && (c.length || seeded())) return c;
  return mockCategories;
}

export function getSimilarProductsServer(product: Product, limit = 4): Product[] {
  return getProductsServer()
    .filter((p) => p.id !== product.id && p.categorySlug === product.categorySlug)
    .slice(0, limit);
}
