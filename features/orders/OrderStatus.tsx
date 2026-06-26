'use client';

import { Check, Clock, CreditCard, Truck, Package, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import type { OrderStatus } from '@/types/order';

export function getOrderStatusMeta(
  t: ReturnType<typeof useTranslations>,
): Record<OrderStatus, { label: string; color: string; icon: typeof Clock; pct: number }> {
  return {
    pending: { label: t('statusPending'), color: 'text-warning', icon: Clock, pct: 20 },
    confirmed: { label: t('statusConfirmed'), color: 'text-info', icon: Check, pct: 40 },
    paid: { label: t('statusPaid'), color: 'text-success', icon: CreditCard, pct: 60 },
    shipping: { label: t('statusShipping'), color: 'text-info', icon: Truck, pct: 80 },
    delivered: { label: t('statusDelivered'), color: 'text-success', icon: Package, pct: 100 },
    cancelled: { label: t('statusCancelled'), color: 'text-danger', icon: X, pct: 0 },
  };
}

const TIMELINE: OrderStatus[] = ['pending', 'confirmed', 'paid', 'shipping', 'delivered'];

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations('orders');
  const meta = getOrderStatusMeta(t)[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider',
        status === 'cancelled'
          ? 'border-danger/40 bg-danger/10 text-danger'
          : status === 'delivered' || status === 'paid'
            ? 'border-success/40 bg-success/10 text-success'
            : 'border-brand-yellow/40 bg-brand-yellow/10 text-brand-yellow',
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {meta.label}
    </span>
  );
}

export function OrderTimeline({ status }: { status: OrderStatus }) {
  const t = useTranslations('orders');

  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-4">
        <X className="h-5 w-5 text-danger" />
        <div>
          <p className="text-sm font-bold text-danger">{t('cancelledTitle')}</p>
          <p className="text-xs text-white/55">{t('cancelledDesc')}</p>
        </div>
      </div>
    );
  }

  const meta = getOrderStatusMeta(t);
  const currentIdx = TIMELINE.indexOf(status);

  return (
    <div className="space-y-3">
      {TIMELINE.map((s, i) => {
        const m = meta[s];
        const Icon = m.icon;
        const done = i < currentIdx;
        const active = i === currentIdx;
        const upcoming = i > currentIdx;
        return (
          <div key={s} className="flex items-center gap-3">
            <div className="relative">
              <div
                className={cn(
                  'relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all',
                  done && 'border-success bg-success text-white',
                  active && 'border-brand-yellow bg-brand-yellow text-brand-dark shadow-glow-sm',
                  upcoming && 'border-brand-surface-border bg-brand-surface text-white/40',
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              {i < TIMELINE.length - 1 && (
                <div
                  className={cn(
                    'absolute left-1/2 top-9 h-7 w-0.5 -translate-x-1/2',
                    done ? 'bg-success' : 'bg-brand-surface-border',
                  )}
                />
              )}
            </div>
            <div className="flex-1 py-1.5">
              <p
                className={cn(
                  'text-sm font-bold',
                  active && 'text-brand-yellow',
                  done && 'text-white',
                  upcoming && 'text-white/40',
                )}
              >
                {m.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
