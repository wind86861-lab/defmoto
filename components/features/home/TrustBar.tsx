'use client';

import { useTranslations } from 'next-intl';
import { ShieldCheck, BadgeCheck, Bike } from 'lucide-react';

export function TrustBar() {
  const t = useTranslations('home');

  const items = [
    { icon: BadgeCheck, label: t('trustVerified') },
    { icon: ShieldCheck, label: t('trustGuarantee') },
    { icon: Bike, label: t('trustTestDrive') },
  ];

  return (
    <section className="border-y border-brand-surface-border/60 bg-brand-surface/40 py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          {items.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 sm:gap-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-yellow/10 text-brand-yellow sm:h-10 sm:w-10">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-white/75 sm:text-sm">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
