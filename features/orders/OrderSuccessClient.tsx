'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check, Send, Package, Home, Clock, RefreshCw, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MotoSpinner } from '@/components/ui/MotoLoader';
import { formatPrice } from '@/lib/format';
import { useOrdersStore } from '@/lib/stores/orders';
import { useCartStore } from '@/lib/stores/cart';
import { useCheckoutState } from '@/features/checkout/useCheckoutState';
import { useHaptic } from '@/hooks/useHaptic';

// Statuses that mean the payment landed (or is COD-accepted) → order is taken.
const PAID_LIKE = ['paid', 'confirmed', 'shipping', 'delivered'];

export function OrderSuccessClient({ id }: { id: string }) {
  const t = useTranslations('orders');
  const order = useOrdersStore((s) => s.orders.find((o) => o.id === id));
  const markPaid = useOrdersStore((s) => s.markPaid);
  const clearCart = useCartStore((s) => s.clear);
  const resetCheckout = useCheckoutState((s) => s.reset);
  const { notify } = useHaptic();
  const router = useRouter();

  const isCash = order?.payment.method === 'cash';
  const [serverStatus, setServerStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(!isCash);

  // Payment is confirmed when: COD, the local order is already marked paid, or
  // the server (set by the Payme/Click callback) reports a paid-like status.
  const confirmed = useMemo(
    () =>
      Boolean(isCash) ||
      Boolean(order?.payment.paid) ||
      PAID_LIKE.includes(serverStatus || '') ||
      PAID_LIKE.includes(order?.status || ''),
    [isCash, order?.payment.paid, order?.status, serverStatus],
  );
  const confirmedRef = useRef(confirmed);
  confirmedRef.current = confirmed;

  // Poll the real server status for online payments until it's confirmed.
  useEffect(() => {
    if (!order || isCash || order.payment.paid) {
      setChecking(false);
      return;
    }
    let alive = true;
    let tries = 0;
    const poll = async () => {
      tries += 1;
      try {
        const r = await fetch(`/api/orders/${id}`, { cache: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          const st: string | undefined = j?.order?.status;
          if (alive && st) {
            setServerStatus(st);
            if (PAID_LIKE.includes(st)) markPaid(id);
          }
        }
      } catch {
        /* ignore */
      }
      if (!alive) return;
      if (confirmedRef.current || tries >= 8) {
        setChecking(false);
        return;
      }
      setTimeout(poll, 2500);
    };
    poll();
    return () => {
      alive = false;
    };
  }, [id, isCash, order, markPaid]);

  // Clear the cart + checkout ONLY once the payment is confirmed.
  useEffect(() => {
    if (confirmed) {
      clearCart();
      resetCheckout();
      notify('success');
    }
  }, [confirmed, clearCart, resetCheckout, notify]);

  // Opened without a local order (cold link) → home.
  useEffect(() => {
    if (!order && typeof window !== 'undefined') {
      const timer = setTimeout(() => router.replace('/'), 1500);
      return () => clearTimeout(timer);
    }
  }, [order, router]);

  if (!order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-white/55">
        {t('notFound')}
      </div>
    );
  }

  // Verifying an online payment.
  if (!confirmed && checking) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <MotoSpinner size={56} />
        <h1 className="mt-6 font-display text-2xl font-extrabold">{t('verifyingTitle')}</h1>
        <p className="mt-2 text-sm text-white/60">{t('verifyingDesc')}</p>
        <p className="mt-3 text-xs text-white/40">#{order.number} · {formatPrice(order.total)}</p>
      </div>
    );
  }

  // Payment not completed (cancelled / failed / still pending). The cart and
  // checkout are preserved, so the buyer can retry without re-entering anything.
  if (!confirmed) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-yellow/15 text-brand-yellow">
          <Clock className="h-10 w-10" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-extrabold">{t('pendingTitle')}</h1>
        <p className="mt-2 text-sm text-white/60">{t('pendingDesc')}</p>
        <p className="mt-1 text-xs text-white/40">#{order.number} · {formatPrice(order.total)}</p>
        <div className="mt-8 w-full space-y-3">
          <Link href="/checkout">
            <Button size="xl" glow fullWidth leftIcon={<RefreshCw className="h-5 w-5" />}>
              {t('retryPaymentButton')}
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="secondary" size="lg" fullWidth leftIcon={<ShoppingCart className="h-4 w-4" />}>
              {t('backToCartButton')}
            </Button>
          </Link>
          <Link href={`/orders/${order.id}`}>
            <Button variant="ghost" size="lg" fullWidth leftIcon={<Package className="h-4 w-4" />}>
              {t('trackOrderButton')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-8 sm:px-6 sm:py-12">
      {/* Success burst */}
      <div className="relative mb-8 flex flex-col items-center text-center">
        <div className="absolute inset-0 -z-10 mx-auto my-auto h-40 w-40 animate-pulse rounded-full bg-success/20 blur-3xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-success to-success/70 shadow-[0_0_48px_rgba(34,197,94,0.5)]">
          <Check className="h-12 w-12 text-white animate-scale-in" strokeWidth={3} />
        </div>

        <h1 className="mt-6 font-display text-display-md font-extrabold text-gradient-yellow sm:text-display-lg">
          {t('thankYouTitle')}
        </h1>
        <p className="mt-2 max-w-md text-sm text-white/65 sm:text-base">
          {t('thankYouDesc')}
        </p>
      </div>

      {/* Order number card */}
      <div className="rounded-3xl border border-brand-yellow/30 bg-gradient-to-br from-brand-surface to-brand-dark p-5 shadow-glow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/55">
              {t('orderNumberLabel')}
            </p>
            <p className="mt-1 font-display text-display-sm font-extrabold text-brand-yellow">
              #{order.number}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-white/55">
              {t('amountLabel')}
            </p>
            <p className="mt-1 font-display text-lg font-extrabold">
              {formatPrice(order.total)}
            </p>
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div className="mt-6 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/45">
          {t('nextStepsTitle')}
        </h3>
        <NextStep step="1" title={t('step1Title')} desc={t('step1Desc')} />
        <NextStep
          step="2"
          title={t('step2Title')}
          desc={order.payment.method === 'cash' ? t('step2DescCash') : t('step2DescOnline')}
        />
        <NextStep
          step="3"
          title={t('step3Title')}
          desc={order.delivery.method === 'pickup' ? t('step3DescPickup') : t('step3DescDelivery')}
        />
      </div>

      {/* CTAs */}
      <div className="mt-8 space-y-3">
        <Link href={`/orders/${order.id}`}>
          <Button size="xl" glow fullWidth leftIcon={<Package className="h-5 w-5" />}>
            {t('trackOrderButton')}
          </Button>
        </Link>

        <Button
          variant="secondary"
          size="lg"
          fullWidth
          leftIcon={<Send className="h-4 w-4" />}
          onClick={() => window.open('https://t.me/DeftMotoBot', '_blank')}
        >
          {t('continueTelegramButton')}
        </Button>

        <Link href="/">
          <Button variant="ghost" size="lg" fullWidth leftIcon={<Home className="h-4 w-4" />}>
            {t('homeButton')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

function NextStep({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow/15 font-display text-base font-extrabold text-brand-yellow">
        {step}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-xs text-white/55">{desc}</p>
      </div>
    </div>
  );
}
