'use client';

import { useTranslations } from 'next-intl';
import { ShieldCheck, Tag, MapPin, Wrench } from 'lucide-react';

export function Advantages() {
  const t = useTranslations('home');

  const items = [
    {
      icon: ShieldCheck,
      title: t('advantageOfficial'),
      desc: t('advantageSubOfficial'),
    },
    {
      icon: Tag,
      title: t('advantageBestPrice'),
      desc: t('advantageSubBestPrice'),
    },
    {
      icon: MapPin,
      title: t('advantageMoreBranches'),
      desc: t('advantageSubBranches'),
    },
    {
      icon: Wrench,
      title: t('advantageServiceSupport'),
      desc: t('advantageSubService'),
    },
  ];

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h2 className="font-display text-display-sm font-extrabold sm:text-display-md">
            {t('advantages')}
          </h2>
          <p className="mt-2 text-sm text-white/55 sm:text-base">
            {t('advantagesSubtitle')}
          </p>
        </header>

        <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, desc }) => (
            <article
              key={title}
              className="group flex flex-col items-center text-center"
            >
              {/* Circular icon */}
              <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-brand-yellow/30 bg-gradient-to-br from-brand-surface to-brand-dark transition-all duration-300 group-hover:-translate-y-1 group-hover:border-brand-yellow/60 group-hover:shadow-glow sm:h-24 sm:w-24">
                <div className="pointer-events-none absolute inset-0 rounded-full bg-brand-yellow/0 blur-xl transition-all duration-300 group-hover:bg-brand-yellow/30" />
                <Icon
                  className="relative h-8 w-8 text-brand-yellow transition-transform duration-300 group-hover:scale-110 sm:h-10 sm:w-10"
                  strokeWidth={1.8}
                />
              </div>
              <h3 className="font-display text-base font-extrabold leading-tight sm:text-lg">
                {title}
              </h3>
              <p className="mt-2 max-w-[200px] text-xs leading-snug text-white/55 sm:text-sm">
                {desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
