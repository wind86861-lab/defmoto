'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Star, MessageSquarePlus, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useToast } from '@/components/ui/Toaster';
import { useHaptic } from '@/hooks/useHaptic';
import type { useProductReviews } from '@/hooks/useProductReviews';

type ReviewsHook = ReturnType<typeof useProductReviews>;

export function ProductReviews({ reviews }: { reviews: ReviewsHook }) {
  const t = useTranslations('product');
  const { data, submit, submitting, isInTelegram, userId } = reviews;
  const { summary, reviews: list, canReview, alreadyReviewed, purchased, myReview } = data;

  const total = summary.count || 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const c = summary.distribution[star - 1] ?? 0;
    return { star, count: c, pct: total ? Math.round((c / total) * 100) : 0 };
  });

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-5 rounded-2xl border border-brand-surface-border bg-brand-surface p-5 sm:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center justify-center text-center sm:items-start sm:text-left">
          <div className="font-display text-display-lg font-extrabold text-gradient-yellow">
            {total ? summary.average.toFixed(1) : '—'}
          </div>
          <div className="mt-1 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-4 w-4',
                  i < Math.round(summary.average)
                    ? 'fill-brand-yellow text-brand-yellow'
                    : 'text-white/20',
                )}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-white/55">
            {total ? t('reviewsCountLabel', { count: total }) : t('reviewNoneShort')}
          </p>
        </div>

        <div className="space-y-1.5">
          {distribution.map((d) => (
            <div key={d.star} className="flex items-center gap-3 text-xs">
              <span className="w-3 font-semibold text-white/70">{d.star}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-surface-elevated">
                <div
                  className="h-full rounded-full bg-gradient-yellow transition-all"
                  style={{ width: `${d.pct}%` }}
                />
              </div>
              <span className="w-10 text-right text-white/55">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review form / gate */}
      <ReviewForm
        canReview={canReview}
        purchased={purchased}
        alreadyReviewed={alreadyReviewed}
        inTelegram={Boolean(isInTelegram || userId)}
        initial={myReview}
        submitting={submitting}
        onSubmit={submit}
      />

      {/* List */}
      {list.length > 0 ? (
        <div className="space-y-3">
          {list.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4"
            >
              <header className="flex items-start gap-3">
                <Avatar name={r.userName} photo={r.photoUrl} />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold">{r.userName}</h4>
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
                    <span className="text-[11px] text-white/45">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </header>
              {r.text && (
                <p className="mt-3 text-sm leading-relaxed text-white/75">{r.text}</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-brand-surface-border py-8 text-center text-sm text-white/45">
          {t('reviewEmpty')}
        </p>
      )}
    </div>
  );
}

function ReviewForm({
  canReview,
  purchased,
  alreadyReviewed,
  inTelegram,
  initial,
  submitting,
  onSubmit,
}: {
  canReview: boolean;
  purchased: boolean;
  alreadyReviewed: boolean;
  inTelegram: boolean;
  initial: { rating: number; text: string } | null;
  submitting: boolean;
  onSubmit: (rating: number, text: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const t = useTranslations('product');
  const toast = useToast();
  const { notify } = useHaptic();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState(initial?.text ?? '');

  // Not a buyer → show the reason instead of the form.
  if (!canReview) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-brand-surface-border bg-brand-surface/60 p-4 text-sm text-white/60">
        <Lock className="h-4 w-4 shrink-0 text-white/40" />
        <span>{inTelegram && !purchased ? t('reviewGatePurchase') : !inTelegram ? t('reviewGateTelegram') : t('reviewGatePurchase')}</span>
      </div>
    );
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        fullWidth
        leftIcon={alreadyReviewed ? <CheckCircle2 className="h-4 w-4" /> : <MessageSquarePlus className="h-4 w-4" />}
        onClick={() => setOpen(true)}
      >
        {alreadyReviewed ? t('reviewFormTitleUpdate') : t('addReviewButton')}
      </Button>
    );
  }

  const submitReview = async () => {
    if (rating < 1) {
      toast.info(t('reviewYourRating'));
      return;
    }
    const res = await onSubmit(rating, text.trim());
    if (res.ok) {
      notify('success');
      toast.success(t('reviewThanks'));
      setOpen(false);
    } else {
      notify('error');
      toast.info(res.error === 'not-purchased' ? t('reviewGatePurchase') : t('reviewError'));
    }
  };

  const shown = hover || rating;

  return (
    <div className="space-y-3 rounded-2xl border border-brand-yellow/25 bg-brand-surface p-4">
      <p className="text-sm font-bold">
        {alreadyReviewed ? t('reviewFormTitleUpdate') : t('reviewFormTitle')}
      </p>

      {/* Star picker */}
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const val = i + 1;
          return (
            <button
              key={i}
              type="button"
              aria-label={`${val}`}
              onMouseEnter={() => setHover(val)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(val)}
              className="p-0.5 transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={cn(
                  'h-7 w-7 transition-colors',
                  val <= shown ? 'fill-brand-yellow text-brand-yellow' : 'text-white/25',
                )}
              />
            </button>
          );
        })}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder={t('reviewPlaceholder')}
        className="w-full resize-none rounded-xl border border-brand-surface-border bg-brand-dark/60 px-3.5 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-brand-yellow/50"
      />

      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting} className="flex-1">
          ✕
        </Button>
        <Button glow onClick={submitReview} loading={submitting} className="flex-[2]">
          {alreadyReviewed ? t('reviewUpdate') : t('reviewSubmit')}
        </Button>
      </div>
    </div>
  );
}

function Avatar({ name, photo }: { name: string; photo?: string }) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={name} className="h-9 w-9 shrink-0 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow/15 text-sm font-bold text-brand-yellow">
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}
