'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useHaptic } from '@/hooks/useHaptic';

export function NotFoundRequest() {
  const t = useTranslations('home');
  const [submitted, setSubmitted] = useState(false);
  const { notify } = useHaptic();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    notify('success');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <section className="py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-yellow p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

          <div className="relative grid gap-6 sm:grid-cols-5 sm:gap-8">
            <div className="sm:col-span-3">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-dark/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-dark backdrop-blur-md">
                <Search className="h-3 w-3" />
                {t('notFoundBadge')}
              </div>
              <h2 className="font-display text-display-md font-extrabold leading-tight text-brand-dark sm:text-display-lg">
                {t('notFoundTitle')}
              </h2>
              <p className="mt-2 text-sm font-medium text-brand-dark/75 sm:text-base">
                {t('notFoundSubtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:col-span-2 sm:justify-center">
              <Input
                placeholder={t('notFoundProductPlaceholder')}
                className="bg-brand-dark/90 text-white placeholder:text-white/40"
                disabled={submitted}
              />
              <Input
                placeholder={t('notFoundPhonePlaceholder')}
                type="tel"
                className="bg-brand-dark/90 text-white placeholder:text-white/40"
                disabled={submitted}
              />
              <button
                type="submit"
                disabled={submitted}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-dark px-5 font-bold text-white shadow-card transition-all hover:bg-black hover:shadow-card-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-success disabled:text-white"
              >
                {submitted ? (
                  <>✓ {t('notFoundSent')}</>
                ) : (
                  <>
                    <span>{t('notFoundCta')}</span>
                    <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
