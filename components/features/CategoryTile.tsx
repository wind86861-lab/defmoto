'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Category } from '@/types/product';

interface CategoryTileProps {
  category: Category;
  variant?: 'circle' | 'card';
  className?: string;
}

export function CategoryTile({
  category,
  variant = 'card',
  className,
}: CategoryTileProps) {
  const t = useTranslations('common');
  const tCategories = useTranslations('categories');
  const categoryName = category.slug ? tCategories(category.slug) : category.name;

  if (variant === 'circle') {
    return (
      <Link
        href={`/catalog/${category.slug}`}
        className={cn(
          'group flex w-20 shrink-0 flex-col items-center gap-2 no-tap-highlight',
          className,
        )}
      >
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-surface-border bg-brand-surface text-2xl transition-all duration-300 ease-spring group-hover:-translate-y-0.5 group-hover:border-brand-yellow/60 group-hover:bg-brand-yellow/10 group-hover:shadow-glow-sm">
          <span className="transition-transform duration-300 group-hover:scale-110">
            {category.icon}
          </span>
        </div>
        <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-white/80 transition-colors group-hover:text-brand-yellow">
          {categoryName}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={`/catalog/${category.slug}`}
      className={cn(
        'group relative flex items-center justify-between overflow-hidden rounded-2xl border border-brand-surface-border bg-brand-surface p-4',
        'transition-all duration-300 ease-spring',
        'hover:-translate-y-0.5 hover:border-brand-yellow/40 hover:shadow-card-hover',
        'no-tap-highlight',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-yellow/10 text-2xl">
          {category.icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">{categoryName}</h3>
          {category.productCount ? (
            <p className="text-xs text-white/45">
              {t('categoryProductCount', { count: category.productCount })}
            </p>
          ) : null}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-white/30 transition-all group-hover:translate-x-0.5 group-hover:text-brand-yellow" />
    </Link>
  );
}
