'use client';

import { useLocale, useTranslations } from 'next-intl';
import { trOf } from '@/lib/i18nField';
import type { DeliveryTerm } from '@/lib/stores/siteSettings';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { ProductReviews } from './ProductReviews';
import type { Product } from '@/types/product';
import type { useProductReviews } from '@/hooks/useProductReviews';
import { Truck, Package, RotateCcw, MapPin } from 'lucide-react';
import { useSiteSettings } from '@/lib/stores/siteSettings';
import { productDescription } from '@/lib/productLocale';
import { useMounted } from '@/hooks/useMounted';

const DELIVERY_ICONS = [Truck, MapPin, Package, RotateCcw];

export function ProductInfo({
  product,
  reviews,
}: {
  product: Product;
  reviews: ReturnType<typeof useProductReviews>;
}) {
  const t = useTranslations('product');
  const locale = useLocale();
  const tCategories = useTranslations('categories');
  const summary = reviews.data.summary;
  const mounted = useMounted();
  const storedTerms = useSiteSettings((s) => s.deliveryTerms);
  // Localized defaults — used unless the admin has set custom delivery terms,
  // so the tab stays translated in all 3 languages.
  const i18nTerms: DeliveryTerm[] = [
    { title: t('deliveryTashkentTitle'), text: t('deliveryTashkentText') },
    { title: t('deliveryRegionsTitle'), text: t('deliveryRegionsText') },
    { title: t('deliveryPickupTitle'), text: t('deliveryPickupText') },
    { title: t('deliveryReturnTitle'), text: t('deliveryReturnText') },
  ];
  const deliveryTerms = mounted && storedTerms?.length ? storedTerms : i18nTerms;

  const items: TabItem[] = [
    {
      key: 'description',
      label: t('tabDescription'),
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-white/75">
          <p>{productDescription(product, locale) ?? t('descriptionPlaceholder')}</p>
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
            [t('specRating'), summary.count ? `${summary.average.toFixed(1)} / 5` : '—'],
            [t('tabReviews'), String(summary.count)],
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
          {deliveryTerms.map((d, i) => {
            const Icon = DELIVERY_ICONS[i % DELIVERY_ICONS.length];
            return (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-brand-surface-border bg-brand-surface p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-yellow/10 text-brand-yellow">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">{trOf(d, 'title', locale)}</h4>
                  <p className="mt-0.5 text-xs text-white/55">{trOf(d, 'text', locale)}</p>
                </div>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      key: 'reviews',
      label: t('tabReviews'),
      count: summary.count || undefined,
      content: <ProductReviews reviews={reviews} />,
    },
  ];

  return <Tabs items={items} />;
}
