/**
 * Server-side reads of admin-managed content (products, categories) straight
 * from the DB, so server-rendered pages (product detail) reflect admin edits
 * and admin-created items — falling back to the mock seed when nothing has
 * been saved yet.
 *
 * The content store is persisted as a whole zustand blob (`{ state, version }`)
 * under the `content-store` key; we read that and extract the slices.
 */

import { getContent } from '@/lib/db';
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

export function getProductsServer(): Product[] {
  const p = contentState()?.products;
  return p && p.length ? p : mockProducts;
}

export function getProductBySlugServer(slug: string): Product | undefined {
  return getProductsServer().find((p) => p.slug === slug);
}

export function getCategoriesServer(): Category[] {
  const c = contentState()?.categories;
  return c && c.length ? c : mockCategories;
}

export function getSimilarProductsServer(product: Product, limit = 4): Product[] {
  return getProductsServer()
    .filter((p) => p.id !== product.id && p.categorySlug === product.categorySlug)
    .slice(0, limit);
}
