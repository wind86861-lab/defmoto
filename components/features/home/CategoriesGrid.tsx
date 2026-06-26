'use client';

import { useTranslations } from 'next-intl';
import { SectionHeader } from '@/components/features/SectionHeader';
import { CategoryTile } from '@/components/features/CategoryTile';
import type { Category } from '@/types/product';

export function CategoriesGrid({ categories }: { categories: Category[] }) {
  const t = useTranslations('home');

  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader title={t('categories')} />
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <CategoryTile key={cat.id} category={cat} variant="card" />
          ))}
        </div>
      </div>
    </section>
  );
}
