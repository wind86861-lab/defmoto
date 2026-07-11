'use client';

import { useTranslations } from 'next-intl';
import { SectionHeader } from '@/components/features/SectionHeader';
import { ProductCard } from '@/components/features/ProductCard';
import type { Product } from '@/types/product';

interface ProductShowcaseProps {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  products: Product[];
  accent?: boolean;
}

export function ProductShowcase({
  title,
  subtitle,
  href,
  hrefLabel,
  products,
  accent,
}: ProductShowcaseProps) {
  const t = useTranslations('common');

  // Nothing to show (admin has no products in this section) → hide it entirely.
  if (!products.length) return null;

  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title={title}
          subtitle={subtitle}
          href={href}
          hrefLabel={hrefLabel ?? t('viewAll')}
          accent={accent}
        />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
