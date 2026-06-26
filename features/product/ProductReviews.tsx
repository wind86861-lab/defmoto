'use client';

import { useTranslations } from 'next-intl';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

interface Props {
  rating?: number;
  count?: number;
}

export function ProductReviews({ rating = 4.7, count = 142 }: Props) {
  const t = useTranslations('product');

  const mockReviews = [
    {
      id: 'r1',
      author: t('review1Author'),
      rating: 5,
      date: t('review1Date'),
      text: t('review1Text'),
    },
    {
      id: 'r2',
      author: t('review2Author'),
      rating: 4,
      date: t('review2Date'),
      text: t('review2Text'),
    },
    {
      id: 'r3',
      author: t('review3Author'),
      rating: 5,
      date: t('review3Date'),
      text: t('review3Text'),
    },
  ];

  const distribution = [
    { star: 5, pct: 78 },
    { star: 4, pct: 14 },
    { star: 3, pct: 5 },
    { star: 2, pct: 2 },
    { star: 1, pct: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-5 rounded-2xl border border-brand-surface-border bg-brand-surface p-5 sm:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center justify-center text-center sm:items-start sm:text-left">
          <div className="font-display text-display-lg font-extrabold text-gradient-yellow">
            {rating.toFixed(1)}
          </div>
          <div className="mt-1 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-4 w-4',
                  i < Math.round(rating)
                    ? 'fill-brand-yellow text-brand-yellow'
                    : 'text-white/20',
                )}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-white/55">{t('reviewsCountLabel', { count })}</p>
        </div>

        <div className="space-y-1.5">
          {distribution.map((d) => (
            <div key={d.star} className="flex items-center gap-3 text-xs">
              <span className="w-3 font-semibold text-white/70">{d.star}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-surface-elevated">
                <div
                  className="h-full rounded-full bg-gradient-yellow"
                  style={{ width: `${d.pct}%` }}
                />
              </div>
              <span className="w-10 text-right text-white/55">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add review CTA */}
      <Button variant="outline" fullWidth>
        {t('addReviewButton')}
      </Button>

      {/* List */}
      <div className="space-y-3">
        {mockReviews.map((r) => (
          <article
            key={r.id}
            className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4"
          >
            <header className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold">{r.author}</h4>
                <div className="mt-0.5 flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-3 w-3',
                          i < r.rating
                            ? 'fill-brand-yellow text-brand-yellow'
                            : 'text-white/20',
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-white/45">{r.date}</span>
                </div>
              </div>
            </header>
            <p className="mt-3 text-sm leading-relaxed text-white/75">{r.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
