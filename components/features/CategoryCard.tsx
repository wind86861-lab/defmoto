'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ProductImage } from '@/components/ui/ProductImage';
import type { Category } from '@/types/product';

interface CategoryCardProps {
  category: Category;
  href?: string;
  active?: boolean;
}

export function CategoryCard({ category, href, active }: CategoryCardProps) {
  const t = useTranslations('common');
  const tCategories = useTranslations('categories');
  const categoryName = category.slug ? tCategories(category.slug) : category.name;

  return (
    <Link
      href={href ?? `/catalog?category=${category.slug}`}
      className={cn(
        'group relative flex h-[112px] w-[280px] shrink-0 items-stretch gap-2.5 overflow-hidden rounded-2xl border p-2.5 transition-all duration-300 ease-spring',
        'hover:-translate-y-0.5 hover:border-brand-yellow/50 hover:shadow-card-hover',
        'no-tap-highlight sm:h-[120px] sm:w-auto sm:gap-3 sm:p-3',
        active
          ? 'border-brand-yellow bg-brand-yellow/8 shadow-glow-sm'
          : 'border-brand-surface-border bg-brand-surface',
      )}
    >
      {/* LEFT — image (~50% of card width) */}
      <div className="relative h-full w-1/2 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-surface-elevated to-brand-dark">
        {category.image ? (
          <>
            <ProductImage
              src={category.image}
              alt={categoryName}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              fallbackClassName="h-full w-full"
            />
            {/* Vignette — fades the photo's own background into the card so it doesn't sit as a hard rectangle */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(10,10,10,0.6)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent to-brand-surface/55" />
            <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-black/30" />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">
            {category.icon}
          </div>
        )}
      </div>

      {/* RIGHT — text + arrow */}
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="min-w-0">
          <h3 className="font-display text-[15px] font-extrabold leading-tight">
            {categoryName}
          </h3>
          {typeof category.productCount === 'number' && (
            <p className="mt-1 text-[11px] font-medium text-white/55">
              {t('categoryProductCount', { count: category.productCount })}
            </p>
          )}
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-yellow text-brand-dark shadow-glow-sm transition-all duration-300 group-hover:translate-x-1 group-hover:brightness-110">
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  );
}
