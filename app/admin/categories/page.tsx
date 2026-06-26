'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Eye, Edit3, Plus, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProductImage } from '@/components/ui/ProductImage';
import { mockCategories } from '@/mocks/categories';

export default function AdminCategoriesPage() {
  const t = useTranslations('admin');

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-display-sm font-extrabold sm:text-display-md">
            {t('navCategories')}
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {t('totalLabel')} <span className="font-bold text-white">{mockCategories.length}</span>{' '}
            {t('categoryUnit', { count: mockCategories.length })}
          </p>
        </div>
        <Button size="md" glow leftIcon={<Plus className="h-4 w-4" />}>
          {t('newCategoryButton')}
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mockCategories.map((c) => (
          <article
            key={c.id}
            className="overflow-hidden rounded-2xl border border-brand-surface-border bg-brand-surface transition-all hover:border-brand-yellow/30"
          >
            <div className="relative h-32 overflow-hidden bg-brand-dark">
              {c.image ? (
                <ProductImage
                  src={c.image}
                  alt={c.name}
                  className="h-full w-full object-cover"
                  fallbackClassName="h-full w-full"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl opacity-30">
                  {c.icon ?? <ImageIcon className="h-10 w-10" />}
                </div>
              )}
              <div className="absolute right-2 top-2 rounded-md bg-brand-dark/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-yellow backdrop-blur-md">
                {c.slug}
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 font-display text-base font-extrabold">
                    {c.icon} {c.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-white/55">
                    {typeof c.productCount === 'number'
                      ? t('productCountText', { count: c.productCount })
                      : t('uncountedLabel')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Link
                    href={`/catalog?category=${c.slug}`}
                    target="_blank"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/8 hover:text-brand-yellow"
                    aria-label={t('viewOnSiteAria')}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/8 hover:text-brand-yellow"
                    aria-label={t('editAria')}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
