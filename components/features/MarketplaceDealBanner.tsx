'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Tag, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSiteSettings, DEFAULT_MARKETPLACES } from '@/lib/stores/siteSettings';
import { useMounted } from '@/hooks/useMounted';

interface MarketplaceDealBannerProps {
  /** Formatted savings string (e.g. "309 000 so'm"). Shown on product pages. */
  savings?: string;
  /** Show a "browse catalog" CTA (home page). */
  withCta?: boolean;
  className?: string;
}

/**
 * "Cheaper than marketplaces" promo banner — yellow gradient block with the
 * marketplace names pulled from the admin-managed list. Used on the home page
 * (brand value prop) and product pages (with the concrete savings).
 */
export function MarketplaceDealBanner({
  savings,
  withCta,
  className,
}: MarketplaceDealBannerProps) {
  const t = useTranslations('priceCompare');
  const mounted = useMounted();
  const stored = useSiteSettings((s) => s.marketplaces);

  const list = (mounted && stored.length ? stored : DEFAULT_MARKETPLACES).filter(
    (m) => m.enabled,
  );
  const markets = list.map((m) => m.name).join(', ') || 'Uzum, Wildberries, Yandex Market';

  return (
    <section className={cn('relative', className)}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-yellow p-5 shadow-card sm:p-7">
        {/* Decorative glows */}
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-dark text-brand-yellow shadow-card sm:h-16 sm:w-16">
              <Tag className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-display-sm font-extrabold leading-none text-brand-dark sm:text-display-md">
                {t('cheaperHeading')}
              </h2>
              <p className="mt-2 text-sm font-semibold text-brand-dark/80 sm:text-base">
                {savings ? t('cheaperSubtitle', { markets }) : t('cheaperHomeTagline')}
              </p>
              {savings && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-dark/90 px-3 py-1.5 text-sm font-bold text-success">
                  <Check className="h-4 w-4" strokeWidth={3} />
                  {t('youSave', { amount: savings })}
                </p>
              )}
              {!savings && (
                <p className="mt-1 text-xs font-medium text-brand-dark/65">
                  {t('cheaperSubtitle', { markets })}
                </p>
              )}
            </div>
          </div>

          {withCta && (
            <Link
              href="/catalog"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 font-bold text-white shadow-card transition-all hover:bg-black hover:shadow-card-hover active:scale-[0.98]"
            >
              {t('cheaperCta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
