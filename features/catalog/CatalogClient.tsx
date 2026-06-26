'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/features/SectionHeader';
import { CategoryCard } from '@/components/features/CategoryCard';
import { FilterPanel } from './FilterPanel';
import { CatalogToolbar, ActiveFilterChips } from './CatalogToolbar';
import { ProductGrid } from './ProductGrid';
import { useCatalogQuery } from './useCatalogQuery';
import { queryProducts, getCategoryBySlug } from '@/mocks/api';
import { mockCategories } from '@/mocks/categories';

export function CatalogClient() {
  const t = useTranslations('catalog');
  const tCategories = useTranslations('categories');
  const { query, activeFilterCount, reset } = useCatalogQuery();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const result = useMemo(() => queryProducts(query), [query]);

  const category = query.category ? getCategoryBySlug(query.category) : undefined;
  const title = category ? tCategories(category.slug) : t('title');
  const subtitle = category
    ? t('subtitleCount', { count: category.productCount ?? result.total })
    : t('subtitleAll');

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <SectionHeader title={title} subtitle={subtitle} />

      {/* === Categories strip — visible always, active highlighted === */}
      <CategoriesStrip activeSlug={query.category} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-brand-surface-border bg-brand-surface scrollbar-hide">
            <FilterPanel facets={result.facets} />
          </div>
        </aside>

        {/* Main column */}
        <div className="min-w-0">
          <CatalogToolbar
            total={result.total}
            onOpenFilters={() => setFiltersOpen(true)}
            activeFilterCount={activeFilterCount}
          />

          <ActiveFilterChips />

          <ProductGrid products={result.items} />

          {result.hasMore && (
            <div className="mt-8 flex justify-center">
              <Button variant="secondary" size="lg">
                {t('loadMore')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t('filtersTitle')}
        side="bottom"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                reset();
                setFiltersOpen(false);
              }}
            >
              {t('clear')}
            </Button>
            <Button fullWidth onClick={() => setFiltersOpen(false)}>
              {t('viewResults', { count: result.total })}
            </Button>
          </div>
        }
      >
        <FilterPanel facets={result.facets} />
      </Sheet>

      {/* Mobile floating filter button — fallback if toolbar not visible */}
      <button
        type="button"
        onClick={() => setFiltersOpen(true)}
        aria-label={t('filtersTitle')}
        className="fixed bottom-20 left-1/2 z-30 flex h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-gradient-yellow px-5 text-sm font-bold text-brand-dark shadow-glow lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        {t('filterButton')}
        {activeFilterCount > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-dark px-1 text-[10px] font-bold text-brand-yellow">
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
}

function CategoriesStrip({ activeSlug }: { activeSlug?: string }) {
  const t = useTranslations('catalog');
  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-white/55">
          {t('categoriesLabel')}
        </h2>
        {activeSlug && (
          <Link
            href="/catalog"
            className="text-xs font-bold text-brand-yellow hover:underline"
          >
            {t('showAllCategories')}
          </Link>
        )}
      </div>

      {/* Mobile: 2-row horizontal scroll. Desktop: 5-column grid — 3 rows for 15 cards */}
      <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:px-0">
        <div className="grid grid-flow-col grid-rows-2 gap-3 sm:grid-flow-row sm:grid-rows-none sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
          <CategoryCard
            category={{ id: 'all', slug: '', name: t('allCategory'), icon: '🗂️' }}
            href="/catalog"
            active={!activeSlug}
          />
          {mockCategories.map((c) => (
            <CategoryCard
              key={c.id}
              category={c}
              active={activeSlug === c.slug}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
