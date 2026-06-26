'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight, Package } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { useOrdersStore } from '@/lib/stores/orders';
import { Button } from '@/components/ui/Button';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatDateTime } from '@/lib/format';
import { OrderStatusBadge } from './OrderStatus';

export function OrdersListClient() {
  const t = useTranslations('orders');
  const orders = useOrdersStore((s) => s.orders);

  if (orders.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow shadow-glow-sm">
          <Package className="h-12 w-12" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-display-md font-extrabold">
          {t('listEmptyTitle')}
        </h1>
        <p className="mt-2 max-w-xs text-sm text-white/55">
          {t('listEmptyDesc')}
        </p>
        <Link href="/catalog" className="mt-6">
          <Button size="xl" glow>
            {t('listEmptyCta')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="font-display text-display-sm font-extrabold sm:text-display-md">
          {t('listTitle')}
        </h1>
        <p className="mt-1 text-sm text-white/55">
          {t('listSubtitle', { count: orders.length })}
        </p>
      </header>

      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="group block rounded-2xl border border-brand-surface-border bg-brand-surface p-4 transition-all hover:border-brand-yellow/40 hover:shadow-card-hover touch-feedback"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-base font-extrabold">
                  #{order.number}
                </p>
                <p className="mt-0.5 text-xs text-white/55">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <div className="mt-3 flex items-center gap-2 overflow-hidden">
              {order.items.slice(0, 4).map((item) => (
                <ProductImage
                  key={item.productId}
                  src={item.image}
                  alt=""
                  className="h-12 w-12 rounded-lg border border-brand-surface-border object-cover"
                  fallbackClassName="h-12 w-12 rounded-lg border border-brand-surface-border"
                />
              ))}
              {order.items.length > 4 && (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-brand-surface-border bg-brand-dark text-xs font-bold">
                  +{order.items.length - 4}
                </div>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="font-display text-base font-extrabold text-brand-yellow">
                  {formatPrice(order.total)}
                </span>
                <ChevronRight className="h-4 w-4 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-yellow" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
