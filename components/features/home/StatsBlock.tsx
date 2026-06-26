'use client';

import { useTranslations } from 'next-intl';

export function StatsBlock() {
  const t = useTranslations('home');

  const stats = [
    { value: '8+', label: t('statsYears') },
    { value: '10K+', label: t('statsClients') },
    { value: '5K+', label: t('statsProducts') },
    { value: '24/7', label: t('statsSupport') },
  ];

  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-brand-yellow/20 bg-gradient-to-br from-brand-surface to-brand-dark p-6 sm:p-10">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-yellow/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-brand-yellow-glow/15 blur-3xl" />

          <div className="relative grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-display-lg font-extrabold text-gradient-yellow sm:text-display-xl">
                  {s.value}
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/55 sm:text-sm">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
