'use client';

import { useTranslations } from 'next-intl';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { ProductReviews } from './ProductReviews';
import type { Product } from '@/types/product';
import { Truck, Package, RotateCcw, MapPin } from 'lucide-react';

export function ProductInfo({ product }: { product: Product }) {
  const t = useTranslations('product');
  const tCategories = useTranslations('categories');

  const items: TabItem[] = [
    {
      key: 'description',
      label: t('tabDescription'),
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-white/75">
          <p>{product.description ?? t('descriptionPlaceholder')}</p>
        </div>
      ),
    },
    {
      key: 'specs',
      label: t('tabSpecs'),
      content: (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {[
            [t('specBrand'), product.brand ?? '—'],
            [t('specCategory'), tCategories(product.categorySlug)],
            [t('specAvailability'), product.inStock ? t('inStockLabel') : t('outOfStockLabel')],
            [t('specRating'), `${product.rating ?? '—'} / 5`],
            [t('tabReviews'), String(product.reviewCount ?? 0)],
          ].map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between rounded-xl border border-brand-surface-border bg-brand-surface px-4 py-3"
            >
              <dt className="text-xs text-white/45">{k}</dt>
              <dd className="text-sm font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      key: 'delivery',
      label: t('tabDelivery'),
      content: (
        <div className="space-y-3">
          {[
            { icon: Truck, title: t('deliveryTashkentTitle'), text: t('deliveryTashkentText') },
            { icon: MapPin, title: t('deliveryRegionsTitle'), text: t('deliveryRegionsText') },
            { icon: Package, title: t('deliveryPickupTitle'), text: t('deliveryPickupText') },
            { icon: RotateCcw, title: t('deliveryReturnTitle'), text: t('deliveryReturnText') },
          ].map((d) => (
            <div
              key={d.title}
              className="flex items-start gap-3 rounded-xl border border-brand-surface-border bg-brand-surface p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-yellow/10 text-brand-yellow">
                <d.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">{d.title}</h4>
                <p className="mt-0.5 text-xs text-white/55">{d.text}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'reviews',
      label: t('tabReviews'),
      count: product.reviewCount,
      content: <ProductReviews rating={product.rating} count={product.reviewCount} />,
    },
  ];

  return <Tabs items={items} />;
}
