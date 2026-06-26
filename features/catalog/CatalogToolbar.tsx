'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Sheet } from '@/components/ui/Sheet';
import { useCatalogQuery } from './useCatalogQuery';
import type { SortKey } from '@/mocks/api';

interface CatalogToolbarProps {
  total: number;
  onOpenFilters: () => void;
  activeFilterCount: number;
}

export function CatalogToolbar({
  total,
  onOpenFilters,
  activeFilterCount,
}: CatalogToolbarProps) {
  const t = useTranslations('catalog');
  const { query, setMany } = useCatalogQuery();
  const [sortOpen, setSortOpen] = useState(false);

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'popular', label: t('sortPopular') },
    { key: 'newest', label: t('sortNewest') },
    { key: 'price-asc', label: t('sortPriceAsc') },
    { key: 'price-desc', label: t('sortPriceDesc') },
    { key: 'rating', label: t('sortRating') },
  ];

  const currentSort = sortOptions.find((s) => s.key === query.sort) ?? sortOptions[0];

  return (
    <>
      <div className="sticky top-14 z-30 -mx-4 mb-5 border-b border-brand-surface-border/60 bg-brand-dark/85 px-4 py-3 backdrop-blur-xl sm:top-16 sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-white/55">{t('subtitleCount', { count: total })}</p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSortOpen(true)}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-brand-surface-border bg-brand-surface px-3 text-xs font-semibold transition-colors hover:border-brand-yellow/40 touch-feedback"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{currentSort.label}</span>
              <span className="sm:hidden">{t('sortButton')}</span>
            </button>

            <button
              type="button"
              onClick={onOpenFilters}
              className={cn(
                'relative flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors touch-feedback lg:hidden',
                activeFilterCount > 0
                  ? 'border-brand-yellow bg-brand-yellow/10 text-brand-yellow'
                  : 'border-brand-surface-border bg-brand-surface hover:border-brand-yellow/40',
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{t('filterButton')}</span>
              {activeFilterCount > 0 && (
                <span className="ml-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-yellow px-1 text-[10px] font-bold text-brand-dark">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <Sheet open={sortOpen} onClose={() => setSortOpen(false)} title={t('sortButton')} side="bottom">
        <div className="p-2">
          {sortOptions.map((opt) => {
            const active = opt.key === query.sort;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setMany({ sort: opt.key === 'popular' ? null : opt.key });
                  setSortOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left text-sm transition-colors touch-feedback',
                  active ? 'bg-brand-yellow/15 text-brand-yellow' : 'hover:bg-white/4',
                )}
              >
                <span className="font-semibold">{opt.label}</span>
                {active && <span className="text-base">✓</span>}
              </button>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}

export function ActiveFilterChips() {
  const t = useTranslations('catalog');
  const { query, setMany, reset, activeFilterCount } = useCatalogQuery();

  if (activeFilterCount === 0) return null;

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  query.brands?.forEach((b) =>
    chips.push({
      key: `brand-${b}`,
      label: b,
      onRemove: () =>
        setMany({ brands: query.brands?.filter((x) => x !== b) ?? [] }),
    }),
  );
  query.colors?.forEach((c) =>
    chips.push({
      key: `color-${c}`,
      label: c,
      onRemove: () =>
        setMany({ colors: query.colors?.filter((x) => x !== c) ?? [] }),
    }),
  );
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    chips.push({
      key: 'price',
      label: t('priceRange'),
      onRemove: () => setMany({ minPrice: null, maxPrice: null }),
    });
  }
  if (query.inStockOnly) {
    chips.push({
      key: 'stock',
      label: t('inStock'),
      onRemove: () => setMany({ inStock: null }),
    });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={c.onRemove}
          className="flex items-center gap-1.5 rounded-full border border-brand-yellow/40 bg-brand-yellow/10 px-3 py-1 text-xs font-semibold text-brand-yellow transition-colors hover:bg-brand-yellow/20 touch-feedback"
        >
          <span>{c.label}</span>
          <X className="h-3 w-3" />
        </button>
      ))}
      <button
        onClick={reset}
        className="rounded-full px-3 py-1 text-xs font-semibold text-white/55 underline-offset-2 hover:text-white hover:underline"
      >
        {t('clear')}
      </button>
    </div>
  );
}
