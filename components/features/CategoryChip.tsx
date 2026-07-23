'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { ProductImage } from '@/components/ui/ProductImage';
import { categoryName as resolveCategoryName } from '@/lib/categoryName';
import type { Category } from '@/types/product';

interface CategoryChipProps {
  category: Category;
  href?: string;
  active?: boolean;
  className?: string;
}

/**
 * Compact category tile for the catalog quick-nav strip — a small square
 * image/icon with the name below. Reads as a clean single-row scroller on
 * mobile (wraps on desktop), much lighter than the full CategoryCard.
 */
export function CategoryChip({ category, href, active, className }: CategoryChipProps) {
  const tCategories = useTranslations('categories');
  const label = category.slug
    ? resolveCategoryName(tCategories, category)
    : category.name;

  return (
    <Link
      href={href ?? `/catalog?category=${category.slug}`}
      className={cn(
        'group flex w-[68px] shrink-0 flex-col items-center gap-1.5 no-tap-highlight sm:w-[80px]',
        className,
      )}
    >
      <div
        className={cn(
          'relative aspect-square w-full overflow-hidden rounded-2xl border transition-all duration-300 ease-spring group-active:scale-95',
          active
            ? 'border-brand-yellow ring-2 ring-brand-yellow/40 shadow-glow-sm'
            : 'border-brand-surface-border bg-brand-surface group-hover:-translate-y-0.5 group-hover:border-brand-yellow/50',
        )}
      >
        {category.image ? (
          <ProductImage
            src={category.image}
            alt={label}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            fallbackClassName="h-full w-full"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-surface-elevated to-brand-dark text-2xl">
            {category.icon}
          </div>
        )}
      </div>
      <span
        className={cn(
          'line-clamp-2 text-center text-[11px] font-semibold leading-tight transition-colors',
          active ? 'text-brand-yellow' : 'text-white/75 group-hover:text-white',
        )}
      >
        {label}
      </span>
    </Link>
  );
}
