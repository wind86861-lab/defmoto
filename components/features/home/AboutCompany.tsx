'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CountUp } from '@/components/ui/CountUp';

export function AboutCompany() {
  const t = useTranslations('home');

  const stats = [
    { value: '5+', label: t('statDealers') },
    { value: '10K+', label: t('statProducts') },
    { value: '5K+', label: t('statHappyClients') },
    { value: '24/7', label: t('statSupport24') },
  ];

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
          {/* LEFT — Title + description + CTA */}
          <div>
            <h2 className="font-display text-display-sm font-extrabold sm:text-display-md">
              {t('aboutTitle')}
            </h2>
            <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-white/65">
              <p>{t('aboutDesc1')}</p>
              <p>{t('aboutDesc2')}</p>
            </div>
            <div className="mt-6">
              <Link href="/about">
                <Button
                  variant="secondary"
                  size="lg"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {t('aboutMore')}
                </Button>
              </Link>
            </div>
          </div>

          {/* RIGHT — Stats grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="relative overflow-hidden rounded-2xl border border-brand-yellow/25 bg-gradient-to-br from-brand-surface to-brand-dark p-6 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-yellow/50 sm:p-7"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-yellow/15 blur-2xl" />
                <div className="relative">
                  <CountUp
                    value={s.value}
                    className="block font-display text-display-lg font-extrabold text-gradient-yellow sm:text-display-xl"
                  />
                  <div className="mt-1 text-xs font-bold uppercase tracking-wider text-white/65 sm:text-sm">
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
