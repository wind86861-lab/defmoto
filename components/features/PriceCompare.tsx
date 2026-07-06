'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { TrendingDown, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { useSiteSettings, DEFAULT_MARKETPLACES } from '@/lib/stores/siteSettings';
import { useMounted } from '@/hooks/useMounted';
import type { Locale } from '@/i18n/config';
import type { CompetitorPrice } from '@/types/product';

interface PriceCompareProps {
  ourPrice: number;
  competitors: CompetitorPrice[];
  className?: string;
  compact?: boolean;
}

const DEFAULT_CHIP_COLOR = '#7B2CBF';

export function PriceCompare({
  ourPrice,
  competitors,
  className,
  compact,
}: PriceCompareProps) {
  const t = useTranslations('priceCompare');
  const locale = useLocale() as Locale;
  const mounted = useMounted();
  const stored = useSiteSettings((s) => s.marketplaces);
  // Marketplace id → uploaded logo, so we can show a real icon instead of text.
  const iconById = useMemo(() => {
    const list = mounted && stored.length ? stored : DEFAULT_MARKETPLACES;
    const map: Record<string, string | undefined> = {};
    for (const m of list) map[m.id] = m.icon;
    return map;
  }, [mounted, stored]);

  const { maxCompetitor, savings, savingsPct } = useMemo(() => {
    const max = Math.max(...competitors.map((c) => c.price));
    const save = max - ourPrice;
    const pct = Math.round((save / max) * 100);
    return { maxCompetitor: max, savings: save, savingsPct: pct };
  }, [competitors, ourPrice]);

  if (!competitors.length) return null;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-brand-yellow/20 bg-gradient-to-br from-brand-surface to-brand-dark p-4',
        className,
      )}
    >
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-yellow/15 blur-3xl" />

      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/65">
            <TrendingDown className="h-3.5 w-3.5 text-brand-yellow" />
            {t('title')}
          </h3>
          <span className="rounded-md bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
            −{savingsPct}%
          </span>
        </div>

        <div className="space-y-2">
          {competitors.map((c, i) => (
            <CompetitorRow
              key={`${c.source}-${i}`}
              label={c.label || c.source}
              color={c.color || DEFAULT_CHIP_COLOR}
              icon={iconById[c.source]}
              price={c.price}
              locale={locale}
              isMax={c.price === maxCompetitor}
            />
          ))}

          {/* Our price — featured */}
          <div className="!mt-3 flex items-center justify-between gap-2 rounded-xl border border-brand-yellow/40 bg-brand-yellow/8 px-3 py-2.5 shadow-glow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-yellow">
                <Check className="h-4 w-4 text-brand-dark" strokeWidth={3} />
              </div>
              <span className="text-sm font-bold text-brand-yellow">
                {t('ourPrice')}
              </span>
            </div>
            <span className="font-display text-lg font-extrabold text-brand-yellow">
              {formatPrice(ourPrice, locale)}
            </span>
          </div>
        </div>

        {!compact && savings > 0 && (
          <div className="mt-3 rounded-lg bg-success/10 px-3 py-2 text-center">
            <p className="text-xs font-semibold text-success">
              💰 {t('youSave', { amount: formatPrice(savings, locale).replace(/[^\d\s]/g, '').trim() })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CompetitorRow({
  label,
  color,
  icon,
  price,
  locale,
  isMax,
}: {
  label: string;
  color: string;
  icon?: string;
  price: number;
  locale: Locale;
  isMax: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition-colors',
        isMax ? 'bg-white/3' : 'bg-transparent',
      )}
    >
      <div className="flex items-center gap-2">
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={icon}
            alt={label}
            className="h-6 w-12 rounded-md bg-white/5 object-contain p-0.5"
          />
        ) : (
          <span
            className="inline-flex h-6 min-w-12 items-center justify-center rounded-md px-1.5 text-[10px] font-bold text-white"
            style={{ background: color }}
          >
            {label}
          </span>
        )}
      </div>
      <span className="font-display text-sm text-white/50 line-through decoration-2">
        {formatPrice(price, locale)}
      </span>
    </div>
  );
}
