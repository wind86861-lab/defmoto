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

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-start gap-3 sm:items-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark text-brand-yellow shadow-card sm:h-14 sm:w-14 sm:rounded-2xl">
              <Tag className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-base font-extrabold leading-tight text-brand-dark sm:text-2xl md:text-display-md">
                {t('cheaperHeading')}
              </h2>
              <p className="mt-1.5 text-xs font-semibold text-brand-dark/80 sm:text-sm">
                {savings ? t('cheaperSubtitle', { markets }) : t('cheaperHomeTagline')}
              </p>
              {savings && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-dark/90 px-2.5 py-1 text-xs font-bold text-success sm:text-sm">
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={3} />
                  {t('youSave', { amount: savings })}
                </p>
              )}
              {!savings && (
                <p className="mt-1 text-[11px] font-medium text-brand-dark/65 sm:text-xs">
                  {t('cheaperSubtitle', { markets })}
                </p>
              )}
            </div>
          </div>

          {withCta && (
            <Link
              href="/catalog"
              className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-dark px-5 text-sm font-bold text-white shadow-card transition-all hover:bg-black hover:shadow-card-hover active:scale-[0.98] sm:h-12 sm:w-auto sm:px-6 sm:text-base"
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
