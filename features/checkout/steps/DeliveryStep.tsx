'use client';

import { Truck, Store, Package } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { useCheckoutState } from '../useCheckoutState';
import type { DeliveryMethod } from '@/types/order';

export function DeliveryStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const t = useTranslations('checkout');
  const { delivery, setDelivery } = useCheckoutState();

  const options: {
    method: DeliveryMethod;
    title: string;
    desc: string;
    icon: typeof Truck;
    price: string;
    duration: string;
  }[] = [
    {
      method: 'courier',
      title: t('courierTitle'),
      desc: t('courierDesc'),
      icon: Truck,
      price: t('courierPrice'),
      duration: t('courierDuration'),
    },
    {
      method: 'pickup',
      title: t('pickupTitle'),
      desc: t('pickupDesc'),
      icon: Store,
      price: t('pickupPrice'),
      duration: t('pickupDuration'),
    },
    {
      method: 'post',
      title: t('postTitle'),
      desc: t('postDesc'),
      icon: Package,
      price: t('postPrice'),
      duration: t('postDuration'),
    },
  ];

  const branches = [
    { id: 'b1', name: t('branch1Name'), address: t('branch1Address') },
    { id: 'b2', name: t('branch2Name'), address: t('branch2Address') },
    { id: 'b3', name: t('branch3Name'), address: t('branch3Address') },
  ];

  const canContinue =
    delivery.method !== 'pickup' || (delivery.method === 'pickup' && delivery.branchId);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-display-sm font-extrabold">
          {t('deliveryTitle')}
        </h2>
        <p className="mt-1 text-sm text-white/55">
          {t('deliverySubtitle')}
        </p>
      </header>

      <div className="space-y-2">
        {options.map((opt) => {
          const active = delivery.method === opt.method;
          const Icon = opt.icon;
          return (
            <button
              key={opt.method}
              type="button"
              onClick={() =>
                setDelivery({ method: opt.method, branchId: undefined })
              }
              className={cn(
                'flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all touch-feedback',
                active
                  ? 'border-brand-yellow bg-brand-yellow/8 shadow-glow-sm'
                  : 'border-brand-surface-border bg-brand-surface hover:border-brand-yellow/40',
              )}
            >
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors',
                  active ? 'bg-gradient-yellow text-brand-dark' : 'bg-brand-surface-elevated text-white/70',
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold">{opt.title}</h3>
                  <span className="shrink-0 text-sm font-bold text-brand-yellow">
                    {opt.price}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-white/55">{opt.desc}</p>
                <p className="mt-1 text-[11px] font-semibold text-white/45">
                  {opt.duration}
                </p>
              </div>
              <div
                className={cn(
                  'h-5 w-5 shrink-0 rounded-full border-2 transition-colors',
                  active
                    ? 'border-brand-yellow bg-brand-yellow shadow-glow-sm ring-2 ring-brand-yellow/30'
                    : 'border-brand-surface-border',
                )}
              />
            </button>
          );
        })}
      </div>

      {delivery.method === 'pickup' && (
        <div className="space-y-2 animate-slide-up">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/45">
            {t('chooseBranch')}
          </h3>
          {branches.map((b) => {
            const active = delivery.branchId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setDelivery({ branchId: b.id })}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors touch-feedback',
                  active
                    ? 'border-brand-yellow bg-brand-yellow/8'
                    : 'border-brand-surface-border bg-brand-surface hover:border-brand-yellow/40',
                )}
              >
                <div
                  className={cn(
                    'h-4 w-4 shrink-0 translate-y-1 rounded-full border-2 transition-colors',
                    active
                      ? 'border-brand-yellow bg-brand-yellow'
                      : 'border-brand-surface-border',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{b.name}</p>
                  <p className="mt-0.5 text-xs text-white/55">{b.address}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" size="xl" onClick={onBack} className="flex-1">
          {t('back')}
        </Button>
        <Button size="xl" glow onClick={onNext} className="flex-[2]" disabled={!canContinue}>
          {t('continue')}
        </Button>
      </div>
    </div>
  );
}
