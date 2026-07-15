'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Search, X, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { useDebounce } from '@/hooks/useDebounce';
import { useRecentSearches } from '@/lib/stores/recentSearches';
import { useHaptic } from '@/hooks/useHaptic';
import { ProductImage } from '@/components/ui/ProductImage';
import { useContentStore } from '@/lib/stores/content';
import { useMounted } from '@/hooks/useMounted';
import { categoryName as resolveCategoryName } from '@/lib/categoryName';
import { mockCategories } from '@/mocks/categories';
import { mockProducts } from '@/mocks/products';

export function SearchClient() {
  const t = useTranslations('search');
  const tCategories = useTranslations('categories');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const debounced = useDebounce(value, 200);
  const { items: recent, add, remove, clear } = useRecentSearches();
  const { impact, selection } = useHaptic();
  const mounted = useMounted();

  // Live catalogue (admin-managed) — mock as fallback before hydration.
  const storeProducts = useContentStore((s) => s.products);
  const storeCategories = useContentStore((s) => s.categories);
  const products = mounted && storeProducts.length ? storeProducts : mockProducts;
  const categories = (mounted && storeCategories.length ? storeCategories : mockCategories).slice(0, 6);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Instant search over the live catalogue (name / brand / category).
  const results = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [debounced, products]);

  // Popular brands — derived from the actual products, most-listed first.
  const brands = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      const b = p.brand?.trim();
      if (b) counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);
  }, [products]);

  const hasQuery = debounced.trim().length > 0;

  const trendingQueries = [
    t('trendingQuery1'),
    t('trendingQuery2'),
    t('trendingQuery3'),
    t('trendingQuery4'),
    t('trendingQuery5'),
  ];

  const submit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    add(trimmed);
    router.push(`/catalog?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Top search bar */}
      <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-brand-surface-border bg-brand-dark px-3 py-3 safe-top sm:px-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t('backAria')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl hover:bg-white/8 touch-feedback"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(value);
          }}
          className="flex flex-1 items-center gap-2 rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 transition-colors focus-within:border-brand-yellow/60 focus-within:shadow-glow-sm"
        >
          <Search className="h-4 w-4 text-white/40" />
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="h-10 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/35"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                impact('light');
                setValue('');
                inputRef.current?.focus();
              }}
              aria-label={t('clearAria')}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/15"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
      </div>

      <div className="px-4 py-5 sm:px-6">
        {/* Idle state — recent + trending */}
        {!hasQuery && (
          <div className="space-y-7">
            {recent.length > 0 && (
              <Section
                icon={<Clock className="h-4 w-4" />}
                title={t('recentTitle')}
                action={
                  <button
                    type="button"
                    onClick={clear}
                    className="text-xs font-semibold text-white/55 hover:text-brand-yellow"
                  >
                    {t('clearRecentButton')}
                  </button>
                }
              >
                <div className="flex flex-wrap gap-2">
                  {recent.map((q) => (
                    <div
                      key={q}
                      className="group flex items-center gap-1 rounded-full border border-brand-surface-border bg-brand-surface pl-3 pr-1 text-sm font-medium"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          selection();
                          setValue(q);
                          submit(q);
                        }}
                        className="py-1.5 text-white/85 hover:text-brand-yellow"
                      >
                        {q}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(q)}
                        aria-label={t('removeAria')}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section
              icon={<TrendingUp className="h-4 w-4" />}
              title={t('trendingTitle')}
            >
              <div className="flex flex-wrap gap-2">
                {trendingQueries.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      selection();
                      setValue(q);
                      submit(q);
                    }}
                    className="rounded-full border border-brand-yellow/30 bg-brand-yellow/8 px-3 py-1.5 text-sm font-semibold text-brand-yellow transition-colors hover:bg-brand-yellow/15 touch-feedback"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </Section>

            {categories.length > 0 && (
              <Section title={t('categoriesTitle')}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/catalog?category=${c.slug}`}
                      className="flex items-center gap-2 rounded-xl border border-brand-surface-border bg-brand-surface px-3 py-2.5 text-sm font-semibold transition-colors hover:border-brand-yellow/40 touch-feedback"
                    >
                      <span className="text-lg">{c.icon}</span>
                      <span className="truncate">
                        {c.slug ? resolveCategoryName(tCategories, c) : c.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {brands.length > 0 && (
              <Section title={t('popularBrandsTitle')}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {brands.map((name) => (
                    <Link
                      key={name}
                      href={`/catalog?brands=${encodeURIComponent(name)}`}
                      className="rounded-xl border border-brand-surface-border bg-brand-surface px-3 py-2.5 text-center text-sm font-semibold transition-colors hover:border-brand-yellow/40 touch-feedback"
                    >
                      {name}
                    </Link>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}

        {/* Result state */}
        {hasQuery && (
          <div className="space-y-4">
            {results.length > 0 ? (
              <>
                <p className="text-xs text-white/55">
                  {t('resultsCount', { count: results.length })}
                </p>
                <ul className="divide-y divide-brand-surface-border overflow-hidden rounded-2xl border border-brand-surface-border bg-brand-surface">
                  {results.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/product/${p.slug}`}
                        onClick={() => add(debounced)}
                        className="flex items-center gap-3 p-3 transition-colors hover:bg-white/4 touch-feedback"
                      >
                        <ProductImage
                          src={p.images[0]}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-xl object-cover"
                          fallbackClassName="h-14 w-14 shrink-0 rounded-xl"
                        />
                        <div className="min-w-0 flex-1">
                          {p.brand && (
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                              {p.brand}
                            </p>
                          )}
                          <p className="line-clamp-1 text-sm font-semibold">
                            {p.name}
                          </p>
                          <p className="mt-0.5 text-xs text-white/55">{p.category}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-display text-sm font-extrabold text-brand-yellow">
                            {formatPrice(p.price)}
                          </div>
                          {p.oldPrice && (
                            <div className="text-[10px] text-white/40 line-through">
                              {formatPrice(p.oldPrice)}
                            </div>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => submit(debounced)}
                  className="block w-full rounded-2xl border border-brand-yellow/40 bg-brand-yellow/10 px-4 py-3 text-center text-sm font-bold text-brand-yellow transition-colors hover:bg-brand-yellow/15 touch-feedback"
                >
                  {t('viewAllResults')}
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-surface-border py-12 text-center">
                <div className="mb-4 text-5xl opacity-70">🔍</div>
                <h3 className="font-display text-lg font-bold">
                  {t('noResultsTitle', { query: debounced })}
                </h3>
                <p className="mt-1 max-w-xs text-sm text-white/55">
                  {t('noResultsDesc')}
                </p>
                <Link
                  href="/catalog"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-brand-yellow/40 bg-brand-yellow/10 px-4 py-2 text-sm font-bold text-brand-yellow"
                >
                  {t('goToCatalogButton')}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-3 flex items-center justify-between">
        <h3 className={cn('flex items-center gap-1.5 text-sm font-bold text-white/85')}>
          {icon && <span className="text-brand-yellow">{icon}</span>}
          {title}
        </h3>
        {action}
      </header>
      {children}
    </section>
  );
}
