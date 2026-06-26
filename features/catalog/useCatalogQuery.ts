'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { ProductQuery, SortKey } from '@/mocks/api';

const arrayKeys = new Set(['brands', 'colors']);

export function useCatalogQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const query = useMemo<ProductQuery>(() => {
    const brands = sp.get('brands')?.split(',').filter(Boolean) ?? [];
    const colors = sp.get('colors')?.split(',').filter(Boolean) ?? [];
    const minPrice = sp.get('minPrice') ? Number(sp.get('minPrice')) : undefined;
    const maxPrice = sp.get('maxPrice') ? Number(sp.get('maxPrice')) : undefined;
    const inStockOnly = sp.get('inStock') === '1';
    const sort = (sp.get('sort') as SortKey) || 'popular';
    const category = sp.get('category') ?? undefined;
    const q = sp.get('q') ?? undefined;
    const page = sp.get('page') ? Number(sp.get('page')) : 1;
    return { brands, colors, minPrice, maxPrice, inStockOnly, sort, category, query: q, page };
  }, [sp]);

  const setMany = useCallback(
    (patch: Partial<Record<string, string | string[] | number | boolean | null>>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined || v === '' || v === false) {
          next.delete(k);
        } else if (Array.isArray(v)) {
          if (v.length === 0) next.delete(k);
          else next.set(k, v.join(','));
        } else if (typeof v === 'boolean') {
          if (v) next.set(k, '1');
          else next.delete(k);
        } else {
          next.set(k, String(v));
        }
      }
      // Reset to page 1 whenever filters change (but not when changing page itself)
      if (!('page' in patch)) next.delete('page');
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, sp],
  );

  const reset = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (query.brands?.length) n += query.brands.length;
    if (query.colors?.length) n += query.colors.length;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) n += 1;
    if (query.inStockOnly) n += 1;
    return n;
  }, [query]);

  return { query, setMany, reset, activeFilterCount };
}
