import { useTranslations } from 'next-intl';
import { ProductCard } from '@/components/features/ProductCard';
import type { Product } from '@/types/product';

export function ProductGrid({ products }: { products: Product[] }) {
  const t = useTranslations('catalog');

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-surface-border py-16 text-center">
        <div className="mb-4 text-5xl">🔍</div>
        <h3 className="font-display text-lg font-bold">{t('emptyTitle')}</h3>
        <p className="mt-1 max-w-xs text-sm text-white/55">{t('emptyDesc')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-brand-surface-border bg-brand-surface"
        >
          <div className="skeleton aspect-square" />
          <div className="space-y-2 p-3">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton mt-2 h-6 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
