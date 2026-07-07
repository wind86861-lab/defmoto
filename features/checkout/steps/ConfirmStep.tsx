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
      : state.delivery.method === 'bts'
        ? state.delivery.btsPrice ?? 0 // live BTS estimate; settled by BTS at shipment
        : afterDiscount >= DELIVERY_FREE_THRESHOLD
          ? 0
          : DELIVERY_FEE;
  const total = afterDiscount + deliveryFee;

  const handleSubmit = async () => {
    setSubmitting(true);
    notify('success');

    // Simulate order creation API call
    await new Promise((r) => setTimeout(r, 700));

    const order: Order = {
      id: `o_${Date.now()}`,
      number: `DM-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
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
        bts:
          state.delivery.method === 'bts' && state.delivery.btsBranchCode
            ? {
                regionCode: state.delivery.btsRegionCode || '',
                cityCode: state.delivery.btsCityCode || '',
                branchCode: state.delivery.btsBranchCode,
                branchName: state.delivery.btsBranchName || '',
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
    clearCart();

    // Cash → straight to success page (no online payment)
    if (state.payment.method === 'cash') {
      resetCheckout();
      router.push(`/order/${order.id}/success`);
      return;
    }

    // Online payment → open PaymentProcessor
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
    setPaymentReq(null);
    resetCheckout();
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

      <div className="flex gap-3">
        <Button variant="secondary" size="xl" onClick={onBack} className="flex-1" disabled={submitting}>
          {t('back')}
        </Button>
        <Button
          size="xl"
          glow
          onClick={handleSubmit}
          className="flex-[2]"
          loading={submitting}
        >
          {state.payment.method === 'cash'
            ? t('confirmOrder')
            : t('payButton', { amount: formatPrice(total) })}
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
            // Redirect to success page after payment closes
            setTimeout(() => {
              router.push(`/order/${paymentReq.orderId}/success`);
              resetCheckout();
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
