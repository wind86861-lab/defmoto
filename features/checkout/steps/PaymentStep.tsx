'use client';

import { CreditCard, Wallet, Banknote } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { useCheckoutState } from '../useCheckoutState';
import type { PaymentMethod } from '@/types/order';

export function PaymentStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const t = useTranslations('checkout');
  const { payment, setPayment } = useCheckoutState();

  const options: {
    method: PaymentMethod;
    title: string;
    desc: string;
    icon: typeof CreditCard;
    badge?: string;
  }[] = [
    {
      method: 'click',
      title: t('brandClick'),
      desc: t('clickDesc'),
      icon: CreditCard,
      badge: t('clickBadge'),
    },
    {
      method: 'payme',
      title: t('brandPayme'),
      desc: t('paymeDesc'),
      icon: Wallet,
      badge: t('paymeBadge'),
    },
    {
      method: 'cash',
      title: t('cashTitle'),
      desc: t('cashDesc'),
      icon: Banknote,
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-display-sm font-extrabold">
          {t('paymentTitle')}
        </h2>
        <p className="mt-1 text-sm text-white/55">
          {t('paymentSubtitle')}
        </p>
      </header>

      <div className="space-y-2">
        {options.map((opt) => {
          const active = payment.method === opt.method;
          const Icon = opt.icon;
          return (
            <button
              key={opt.method}
              type="button"
              onClick={() => setPayment({ method: opt.method })}
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
                  active
                    ? 'bg-gradient-yellow text-brand-dark'
                    : 'bg-brand-surface-elevated text-white/70',
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-bold">{opt.title}</h3>
                  {opt.badge && (
                    <span className="rounded-md bg-brand-yellow/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-yellow">
                      {opt.badge}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-white/55">{opt.desc}</p>
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

      <div className="flex gap-3">
        <Button variant="secondary" size="xl" onClick={onBack} className="flex-1">
          {t('back')}
        </Button>
        <Button size="xl" glow onClick={onNext} className="flex-[2]">
          {t('continue')}
        </Button>
      </div>
    </div>
  );
}
