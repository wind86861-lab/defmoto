'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { PriceRange } from '@/components/ui/PriceRange';
import { useCatalogQuery } from './useCatalogQuery';
import type { ProductListResponse } from '@/mocks/api';
import { mockCategories } from '@/mocks/categories';

interface FilterPanelProps {
  facets: ProductListResponse['facets'];
  className?: string;
}

export function FilterPanel({ facets, className }: FilterPanelProps) {
  const t = useTranslations('catalog');
  const { query, setMany } = useCatalogQuery();

  const toggleBrand = (slug: string) => {
    const set = new Set(query.brands);
    if (set.has(slug)) set.delete(slug);
    else set.add(slug);
    setMany({ brands: Array.from(set) });
  };

  const toggleColor = (hex: string) => {
    const set = new Set(query.colors);
    if (set.has(hex)) set.delete(hex);
    else set.add(hex);
    setMany({ colors: Array.from(set) });
  };

  return (
    <div className={cn('space-y-6 p-5', className)}>
      {/* Category */}
      <FilterSection title={t('category')}>
        <div className="space-y-1">
          <CategoryRow
            label={t('allCategory')}
            active={!query.category}
            count={facets.brands.reduce((s, b) => s + b.count, 0)}
            onClick={() => setMany({ category: null })}
          />
          {mockCategories.map((c) => (
            <CategoryRow
              key={c.id}
              label={`${c.icon ?? ''} ${c.name}`}
              active={query.category === c.slug}
              count={c.productCount}
              onClick={() => setMany({ category: c.slug })}
            />
          ))}
        </div>
      </FilterSection>

      {/* Price */}
      <FilterSection title={t('priceRange')}>
        <PriceRange
          min={facets.priceMin}
          max={facets.priceMax}
          value={[
            query.minPrice ?? facets.priceMin,
            query.maxPrice ?? facets.priceMax,
          ]}
          onChange={([lo, hi]) =>
            setMany({
              minPrice: lo === facets.priceMin ? null : lo,
              maxPrice: hi === facets.priceMax ? null : hi,
            })
          }
        />
      </FilterSection>

      {/* Brands */}
      <FilterSection title={t('brand')}>
        <div className="space-y-1">
          {facets.brands.map((b) => {
            const active = query.brands?.includes(b.slug) ?? false;
            return (
              <CheckRow
                key={b.slug}
                active={active}
                label={b.name}
                count={b.count}
                onClick={() => toggleBrand(b.slug)}
              />
            );
          })}
        </div>
      </FilterSection>

      {/* Colors */}
      <FilterSection title={t('color')}>
        <div className="flex flex-wrap gap-2">
          {facets.colors.map((c) => {
            const active = query.colors?.includes(c.hex) ?? false;
            const lightish = ['#F5F5F5', '#FFB800', '#FFD700'].includes(c.hex);
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => toggleColor(c.hex)}
                aria-label={c.name}
                title={`${c.name} (${c.count})`}
                className={cn(
                  'relative h-9 w-9 rounded-full border-2 transition-all touch-feedback',
                  active
                    ? 'border-brand-yellow shadow-glow-sm'
                    : 'border-brand-surface-border hover:border-white/30',
                )}
                style={{ background: c.hex }}
              >
                {active && (
                  <Check
                    className={cn(
                      'absolute inset-0 m-auto h-4 w-4',
                      lightish ? 'text-brand-dark' : 'text-white',
                    )}
                    strokeWidth={3}
                  />
                )}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* In stock */}
      <FilterSection title={t('availability')}>
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-brand-surface px-3 py-3">
          <span className="text-sm font-semibold">{t('inStockOnly')}</span>
          <Toggle
            checked={!!query.inStockOnly}
            onChange={(v) => setMany({ inStock: v })}
          />
        </label>
      </FilterSection>
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-white/45">
        {title}
      </h3>
      {children}
    </section>
  );
}

function CategoryRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors touch-feedback',
        active
          ? 'bg-brand-yellow/15 text-brand-yellow'
          : 'text-white/75 hover:bg-white/4 hover:text-white',
      )}
    >
      <span className="truncate font-semibold">{label}</span>
      {typeof count === 'number' && (
        <span className="ml-2 shrink-0 text-xs text-white/40">{count}</span>
      )}
    </button>
  );
}

function CheckRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/4 touch-feedback"
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-md border transition-all',
            active
              ? 'border-brand-yellow bg-brand-yellow shadow-glow-sm'
              : 'border-brand-surface-border bg-brand-surface',
          )}
        >
          {active && <Check className="h-3 w-3 text-brand-dark" strokeWidth={3} />}
        </span>
        <span
          className={cn(
            'text-sm font-medium',
            active ? 'text-white' : 'text-white/75',
          )}
        >
          {label}
        </span>
      </span>
      {typeof count === 'number' && (
        <span className="text-xs text-white/40">{count}</span>
      )}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full border transition-all',
        checked
          ? 'border-brand-yellow bg-brand-yellow shadow-glow-sm'
          : 'border-brand-surface-border bg-brand-surface',
      )}
    >
      <span
        className={cn(
          'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white transition-transform',
          checked ? 'left-[calc(100%-1.125rem)] !bg-brand-dark' : 'left-1',
        )}
      />
    </button>
  );
}
