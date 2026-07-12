'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { TrendingDown, Check, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { useSiteSettings, DEFAULT_MARKETPLACES } from '@/lib/stores/siteSettings';
import { useMounted } from '@/hooks/useMounted';
import type { Locale } from '@/i18n/config';
import type { CompetitorPrice } from '@/types/product';

const norm = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

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

  // Map a competitor to its marketplace's uploaded logo. Match tolerantly by
  // id / label / name (and an "mp-" stripped form) so both admin-created
  // (source = marketplace id) and seeded (source = "uzum") data resolve.
  const iconFor = useMemo(() => {
    const markets = mounted && stored.length ? stored : DEFAULT_MARKETPLACES;
    const index: Record<string, string> = {};
    for (const m of markets) {
      if (!m.icon) continue;
      for (const k of [m.id, m.id.replace(/^mp-?/, ''), m.label, m.name]) {
        const nk = norm(k);
        if (nk) index[nk] = m.icon;
      }
    }
    return (c: CompetitorPrice): string | undefined =>
      index[norm(c.source)] || index[norm(c.label)] || index[norm(c.source).replace(/^mp/, '')];
  }, [mounted, stored]);

  const { savings, savingsPct } = useMemo(() => {
    const max = Math.max(...competitors.map((c) => c.price));
    const save = max - ourPrice;
    const pct = Math.round((save / max) * 100);
    return { savings: save, savingsPct: pct };
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
              icon={iconFor(c)}
              url={c.url}
              storeLabel={t('goToStore')}
              price={c.price}
              locale={locale}
            />
          ))}

          {/* Our price — featured winner card */}
          <div className="!mt-3 flex items-center gap-3 rounded-2xl border-2 border-brand-yellow/50 bg-brand-yellow/10 p-3 shadow-glow-sm">
            <div className="flex h-11 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-yellow">
              <Check className="h-6 w-6 text-brand-dark" strokeWidth={3} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-extrabold text-brand-yellow">{t('ourPrice')}</span>
                <span className="shrink-0 rounded-md bg-success/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-success">
                  −{savingsPct}%
                </span>
              </div>
              <span className="font-display text-lg font-extrabold text-brand-yellow">
                {formatPrice(ourPrice, locale)}
              </span>
            </div>
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
  url,
  storeLabel,
  price,
  locale,
}: {
  label: string;
  color: string;
  icon?: string;
  url?: string;
  storeLabel: string;
  price: number;
  locale: Locale;
}) {
  // Logo on a clean white tile (with a hairline ring so light logos still read
  // as a tile), or a coloured brand tile with the name when there's no logo.
  const logoTile = (
    <div
      className={cn(
        'flex h-12 w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl',
        icon ? 'bg-white p-2 ring-1 ring-black/10' : 'px-2',
      )}
      style={icon ? undefined : { background: color }}
    >
      {icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt={label} className="h-full w-full object-contain" />
      ) : (
        <span className="truncate text-xs font-black uppercase tracking-wide text-white">{label}</span>
      )}
    </div>
  );

  const content = (
    <div className="flex items-center gap-3">
      {logoTile}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{label}</p>
        <p className="mt-0.5 flex items-baseline gap-1.5">
          <span className="font-display text-base font-bold text-white/45 line-through decoration-white/25 decoration-2">
            {formatPrice(price, locale)}
          </span>
        </p>
      </div>

      {url && (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/12 bg-white/5 py-1.5 pl-3.5 pr-1.5 text-[11px] font-bold uppercase tracking-wide text-white/70 transition-all group-hover/row:border-brand-yellow/45 group-hover/row:text-brand-yellow">
          {storeLabel}
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/85 transition-all group-hover/row:bg-brand-yellow group-hover/row:text-brand-dark group-hover/row:shadow-glow-sm">
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/row:translate-x-0.5 group-hover/row:-translate-y-0.5" />
          </span>
        </span>
      )}
    </div>
  );

  const cls = 'block rounded-2xl border border-brand-surface-border bg-brand-surface/50 p-2.5 transition-all';

  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(cls, 'group/row hover:border-brand-yellow/30 hover:bg-brand-surface active:scale-[0.99]')}
    >
      {content}
    </a>
  ) : (
    <div className={cls}>{content}</div>
  );
}
