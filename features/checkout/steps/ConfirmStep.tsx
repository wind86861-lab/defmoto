'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { User, MapPin, Truck, Wallet, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/format';
import { useCartStore } from '@/lib/stores/cart';
import { useOrdersStore } from '@/lib/stores/orders';
import { useTelegram } from '@/components/providers/TelegramProvider';
import { useHaptic } from '@/hooks/useHaptic';
import { useToast } from '@/components/ui/Toaster';
import { useCheckoutState } from '../useCheckoutState';
import { applyPromo } from '@/lib/promo';
import { PaymentProcessor } from '@/features/payment/PaymentProcessor';
import type { Order } from '@/types/order';
import type { PaymentRequest } from '@/types/payment';

const DELIVERY_FREE_THRESHOLD = 500_000;
const DELIVERY_FEE = 25_000;

export function ConfirmStep({ onBack }: { onBack: () => void }) {
  const t = useTranslations('checkout');
  const router = useRouter();
  const state = useCheckoutState();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const addOrder = useOrdersStore((s) => s.add);
  const resetCheckout = useCheckoutState((s) => s.reset);
  const { user } = useTelegram();
  const { notify } = useHaptic();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [paymentReq, setPaymentReq] = useState<PaymentRequest | null>(null);

  const deliveryLabels: Record<string, string> = {
    courier: t('courierTitle'),
    pickup: t('pickupTitle'),
    post: t('postTitle'),
    bts: t('btsBranchTitle'),
  };

  const paymentLabels: Record<string, string> = {
    click: t('brandClick'),
    payme: t('brandPayme'),
    bts: t('brandBts'),
    cash: t('cashTitle'),
  };

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const promoResult = state.promoCode ? applyPromo(state.promoCode, subtotal) : null;
  const discount = promoResult?.ok ? promoResult.discount : 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const deliveryFee =
    state.delivery.method === 'pickup'
      ? 0
      : state.delivery.btsPrice != null
        ? state.delivery.btsPrice // live BTS estimate (filial or courier)
        : afterDiscount >= DELIVERY_FREE_THRESHOLD
          ? 0
          : DELIVERY_FEE;
  const total = afterDiscount + deliveryFee;

  const handleSubmit = async () => {
    setSubmitting(true);
    notify('success');

    const order: Order = {
      // Random suffix so two orders placed in the same millisecond can't collide
      // (the id is the payment/lookup key). Number is timestamp-based for spread.
      id: `o_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      number: `DM-${String(Date.now()).slice(-6)}`,
      createdAt: new Date().toISOString(),
      // Cash orders are auto-accepted on placement (no separate "accept" step);
      // online orders stay pending until the payment callback marks them paid.
      status: state.payment.method === 'cash' ? 'confirmed' : 'pending',
      items: [...items],
      subtotal,
      discount,
      deliveryFee,
      total,
      promoCode: state.promoCode,
      delivery: {
        method: state.delivery.method,
        branchId: state.delivery.branchId,
        address:
          state.delivery.method === 'post' || state.delivery.method === 'courier'
            ? state.address
            : undefined,
        // BTS destination — a branch (filial pickup) or just a city (courier).
        bts: state.delivery.btsCityCode
          ? {
              originId: state.delivery.btsOriginId || undefined,
              originName: state.delivery.btsOriginName || undefined,
              regionCode: state.delivery.btsRegionCode || '',
              cityCode: state.delivery.btsCityCode,
              cityName: state.delivery.btsCityName || '',
              branchCode: state.delivery.btsBranchCode || undefined,
              branchName: state.delivery.btsBranchName || undefined,
              branchAddress: state.delivery.btsBranchAddress,
            }
          : undefined,
      },
      payment: {
        method: state.payment.method,
        paid: false,
      },
      contact: state.contact,
    };

    addOrder(order);
    // Persist a global copy for the admin (fire-and-forget).
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: order.id,
        number: order.number,
        status: order.status,
        customerName: order.contact.name,
        phone: order.contact.phone,
        userId: user?.id != null ? String(user.id) : undefined,
        total: order.total,
        payload: order,
      }),
    }).catch(() => {});

    // Cash (COD) is accepted immediately → confirm, clear cart + go to success.
    if (state.payment.method === 'cash') {
      toast.success(t('orderAcceptedTitle'), t('orderAcceptedDesc'));
      clearCart();
      resetCheckout();
      router.push(`/order/${order.id}/success`);
      return;
    }

    // Online payment → open PaymentProcessor (redirects to the provider).
    // Keep the cart + checkout intact: they're cleared only once the payment is
    // confirmed on the success page, so a cancelled/failed payment loses nothing.
    setPaymentReq({
      orderId: order.id,
      orderNumber: order.number,
      amount: total,
      method: state.payment.method,
      phone: state.contact.phone,
      description: `Order #${order.number}`,
    });
    setSubmitting(false);
  };

  const handlePaymentClose = () => {
    // Cancelled / failed payment: keep the cart + checkout so the buyer can
    // retry or pick another method — nothing is reset here.
    setPaymentReq(null);
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-display-sm font-extrabold">
          {t('confirmTitle')}
        </h2>
        <p className="mt-1 text-sm text-white/55">
          {t('confirmSubtitle')}
        </p>
      </header>

      <div className="space-y-3">
        <SummaryRow
          icon={User}
          title={t('contactLabel')}
          lines={[state.contact.name, state.contact.phone]}
        />
        <SummaryRow
          icon={Truck}
          title={t('deliveryTitle')}
          lines={[
            deliveryLabels[state.delivery.method],
            state.delivery.method === 'bts'
              ? `${state.delivery.btsBranchName ?? ''}${state.delivery.btsCityName ? `, ${state.delivery.btsCityName}` : ''}`
              : state.delivery.method === 'pickup'
                ? t('branchNumber', { number: state.delivery.branchId?.slice(-1) ?? '?' })
                : `${state.address.city}, ${state.address.street}${state.address.apartment ? `, ${state.address.apartment}` : ''}`,
          ]}
        />
        <SummaryRow
          icon={Wallet}
          title={t('paymentLabel')}
          lines={[paymentLabels[state.payment.method]]}
        />
        <SummaryRow
          icon={ShoppingBag}
          title={t('itemsLabel', { count: items.length })}
          lines={items.map((i) => `${i.name} × ${i.quantity}`)}
        />
      </div>

      {/* Summary */}
      <div className="space-y-2 rounded-2xl border border-brand-surface-border bg-brand-surface p-4 text-sm">
        <Row label={t('itemsPrice')} value={formatPrice(subtotal)} />
        {discount > 0 && (
          <Row
            label={t('discount')}
            value={`− ${formatPrice(discount)}`}
            valueClassName="text-success"
          />
        )}
        <Row
          label={t('deliveryTitle')}
          value={deliveryFee === 0 ? <span className="font-bold text-success">{t('free')}</span> : formatPrice(deliveryFee)}
        />
        <div className="flex items-baseline justify-between border-t border-brand-surface-border pt-3">
          <span className="text-sm font-semibold text-white/65">{t('totalPayment')}</span>
          <span className="font-display text-display-sm font-extrabold text-brand-yellow">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      {/* Stack on mobile so the long "To'lash — <amount>" button always fits;
          side-by-side from sm up. */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button
          variant="secondary"
          size="xl"
          onClick={onBack}
          fullWidth
          className="sm:flex-1"
          disabled={submitting}
        >
          {t('back')}
        </Button>
        <Button
          size="xl"
          glow
          fullWidth
          onClick={handleSubmit}
          className="min-w-0 sm:flex-[2]"
          loading={submitting}
        >
          <span className="truncate">
            {state.payment.method === 'cash'
              ? t('confirmOrder')
              : t('payButton', { amount: formatPrice(total) })}
          </span>
        </Button>
      </div>

      <p className="text-center text-[11px] text-white/45">
        {t('termsPrefix')}{' '}
        <a className="text-brand-yellow underline-offset-2 hover:underline" href="/about">
          {t('termsLink')}
        </a>
        {t('termsSuffix') && <>{' '}{t('termsSuffix')}</>}
      </p>

      {/* Payment modal */}
      {paymentReq && (
        <PaymentProcessor
          open={Boolean(paymentReq)}
          request={paymentReq}
          onClose={handlePaymentClose}
          onSuccess={() => {
            // Go to the success page — it verifies the payment and only then
            // clears the cart + checkout. (For the live redirect flow this line
            // isn't reached; the provider returns the buyer to the success page.)
            setTimeout(() => {
              router.push(`/order/${paymentReq.orderId}/success`);
            }, 600);
          }}
        />
      )}
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  title,
  lines,
}: {
  icon: typeof User;
  title: string;
  lines: string[];
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-brand-surface-border bg-brand-surface p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-yellow/10 text-brand-yellow">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-white/45">
          {title}
        </p>
        {lines.map((line, i) => (
          <p
            key={i}
            className={
              i === 0
                ? 'text-sm font-bold'
                : 'mt-0.5 line-clamp-1 text-xs text-white/65'
            }
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-white/65">{label}</span>
      <span className={`font-semibold ${valueClassName ?? ''}`}>{value}</span>
    </div>
  );
}
