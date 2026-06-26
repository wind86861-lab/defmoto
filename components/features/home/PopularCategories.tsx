'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { CategoryCard } from '@/components/features/CategoryCard';
import type { Category } from '@/types/product';

export function PopularCategories({ categories }: { categories: Category[] }) {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');

  return (
    <section className="relative pb-10 pt-7 sm:pb-14 sm:pt-9 lg:pt-11">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <header className="mb-5 flex items-end justify-between gap-3">
          <h2 className="font-display text-display-sm font-extrabold sm:text-display-md">
            {t('popularCategories')}
          </h2>
          <Link
            href="/catalog"
            className="group inline-flex items-center gap-1 text-sm font-semibold text-brand-yellow"
          >
            <span className="hidden sm:inline">{t('categories')}</span>
            <span className="sm:hidden">{tCommon('viewAll')}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </header>

        {/* Mobile: horizontal scroll. Desktop: 5-column grid */}
        <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:px-0">
          <div className="flex gap-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
