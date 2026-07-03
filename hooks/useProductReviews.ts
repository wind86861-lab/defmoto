'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTelegram } from '@/components/providers/TelegramProvider';

export interface ReviewItem {
  id: string;
  userName: string;
  photoUrl?: string;
  rating: number;
  text: string;
  createdAt: number;
}

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: [number, number, number, number, number];
}

export interface ReviewsData {
  summary: ReviewSummary;
  reviews: ReviewItem[];
  canReview: boolean;
  alreadyReviewed: boolean;
  purchased: boolean;
  myReview: ReviewItem | null;
}

const EMPTY: ReviewsData = {
  summary: { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] },
  reviews: [],
  canReview: false,
  alreadyReviewed: false,
  purchased: false,
  myReview: null,
};

export function useProductReviews(productId: string) {
  const { user, isInTelegram } = useTelegram();
  const userId = user?.id != null ? String(user.id) : '';
  const [data, setData] = useState<ReviewsData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const q = new URLSearchParams({ productId });
      if (userId) q.set('userId', userId);
      const res = await fetch(`/api/reviews?${q.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (json?.ok) {
        setData({
          summary: json.summary,
          reviews: json.reviews,
          canReview: Boolean(json.canReview),
          alreadyReviewed: Boolean(json.alreadyReviewed),
          purchased: Boolean(json.purchased),
          myReview: json.myReview ?? null,
        });
      }
    } catch {
      /* keep previous */
    } finally {
      setLoading(false);
    }
  }, [productId, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submit = useCallback(
    async (rating: number, text: string): Promise<{ ok: boolean; error?: string }> => {
      if (!userId) return { ok: false, error: 'no-user' };
      setSubmitting(true);
      try {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            rating,
            text,
            userId,
            userName:
              [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
              user?.username ||
              'Mijoz',
            photoUrl: user?.photo_url,
          }),
        });
        const json = await res.json();
        if (json?.ok) await refresh();
        return json;
      } catch {
        return { ok: false, error: 'network' };
      } finally {
        setSubmitting(false);
      }
    },
    [productId, userId, user, refresh],
  );

  return { data, loading, submitting, submit, refresh, userId, isInTelegram };
}
