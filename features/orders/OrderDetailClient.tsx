'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Truck,
  Wallet,
  User,
  CreditCard,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/format';
import { useOrdersStore } from '@/lib/stores/orders';
import { ProductImage } from '@/components/ui/ProductImage';
import { OrderStatusBadge, OrderTimeline } from './OrderStatus';
import { PaymentProcessor } from '@/features/payment/PaymentProcessor';
import { RoadDashLoader } from '@/components/ui/MotoLoader';
import { formatDateTime } from '@/lib/format';
import type { PaymentRequest } from '@/types/payment';
import type { Order } from '@/types/order';

export function OrderDetailClient({ id }: { id: string }) {
  const t = useTranslations('orders');
  const router = useRouter();
  const localOrder = useOrdersStore((s) => s.orders.find((o) => o.id === id));
  // Cross-device: if not on this device, load it from the server (owner-only).
  const [fetched, setFetched] = useState<Order | null | undefined>(undefined);
  useEffect(() => {
    if (localOrder) return;
    let active = true;
    fetch(`/api/orders/${id}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!active) return;
        if (j?.ok && j.order) {
          const p = (j.order.payload || {}) as Order;
          setFetched({
            ...p,
            id: j.order.id,
            number: j.order.number,
            status: j.order.status,
            total: j.order.total,
          });
        } else setFetched(null);
      })
      .catch(() => active && setFetched(null));
    return () => {
      active = false;
    };
  }, [id, localOrder]);
  const order = localOrder ?? fetched ?? undefined;
  const [paymentOpen, setPaymentOpen] = useState(false);

  const deliveryLabels: Record<string, string> = {
    courier: t('methodCourier'),
    pickup: t('methodPickup'),
    post: t('methodPost'),
  };

  const paymentLabels: Record<string, string> = {
    click: t('payClick'),
    payme: t('payPayme'),
    bts: t('payBts'),
    cash: t('payCash'),
  };

  useEffect(() => {
    // Only give up once the server has also confirmed it isn't ours.
    if (!localOrder && fetched === null) {
      const timer = setTimeout(() => router.replace('/orders'), 100);
      return () => clearTimeout(timer);
    }
  }, [localOrder, fetched, router]);

  const isOnline = order && order.payment.method !== 'cash';
  const isUnpaid = order && !order.payment.paid && order.status !== 'cancelled';
  const canPay = Boolean(isOnline && isUnpaid);

  const paymentReq = useMemo<PaymentRequest | null>(() => {
    if (!order || !canPay) return null;
    return {
      orderId: order.id,
      orderNumber: order.number,
      amount: order.total,
      method: order.payment.method,
      phone: order.contact.phone,
      description: `Order #${order.number}`,
    };
  }, [order, canPay]);

  if (!order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <RoadDashLoader size="lg" label={t('loadingLabel')} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/orders"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl hover:bg-white/8 touch-feedback"
          aria-label={t('backAria')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-display-sm font-extrabold">
            #{order.number}
          </h1>
          <p className="mt-0.5 text-xs text-white/55">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Timeline */}
          <section className="rounded-2xl border border-brand-surface-border bg-brand-surface p-5">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/45">
              {t('statusSectionTitle')}
            </h2>
            <OrderTimeline status={order.status} paymentMethod={order.payment?.method} deliveryMethod={order.delivery?.method} />
          </section>

          {/* Items */}
          <section className="rounded-2xl border border-brand-surface-border bg-brand-surface p-5">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/45">
              {t('itemsSectionTitle', { count: order.items.length })}
            </h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.productId} className="flex gap-3">
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    fallbackClassName="h-16 w-16 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold">{item.name}</p>
                    <p className="mt-1 text-xs text-white/55">
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <span className="shrink-0 self-center font-display text-sm font-extrabold text-brand-yellow">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Details */}
          <section className="space-y-3">
            <DetailRow
              icon={User}
              title={t('contactLabel')}
              lines={[order.contact.name, order.contact.phone]}
            />
            <DetailRow
              icon={Truck}
              title={t('deliveryLabel')}
              lines={[
                deliveryLabels[order.delivery.method],
                order.delivery.address
                  ? `${order.delivery.address.city}, ${order.delivery.address.street}`
                  : t('methodPickup'),
              ]}
            />
            <div className="flex items-start gap-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-yellow/10 text-brand-yellow">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/45">
                  {t('paymentLabel')}
                </p>
                <p className="text-sm font-bold">
                  {paymentLabels[order.payment.method]}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs">
                  {order.payment.paid ? (
                    <>
                      <Check className="h-3 w-3 text-success" strokeWidth={3} />
                      <span className="font-semibold text-success">
                        {t('paidLabel')}
                      </span>
                    </>
                  ) : (
                    <span className="font-semibold text-warning">
                      {t('unpaidLabel')}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Summary side */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="space-y-2 rounded-2xl border border-brand-surface-border bg-brand-surface p-5 text-sm">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">
              {t('summaryTitle')}
            </h3>
            <Row label={t('itemsPriceLabel')} value={formatPrice(order.subtotal)} />
            {order.discount > 0 && (
              <Row
                label={t('discountLabel')}
                value={`− ${formatPrice(order.discount)}`}
                valueClassName="text-success"
              />
            )}
            <Row
              label={t('deliveryLabel')}
              value={
                order.deliveryFee === 0
                  ? <span className="font-bold text-success">{t('freeLabel')}</span>
                  : formatPrice(order.deliveryFee)
              }
            />
            <div className="flex items-baseline justify-between border-t border-brand-surface-border pt-3">
              <span className="text-white/65">{t('totalLabel')}</span>
              <span className="font-display text-lg font-extrabold text-brand-yellow">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          {canPay && (
            <Button
              size="xl"
              glow
              fullWidth
              leftIcon={<CreditCard className="h-5 w-5" />}
              onClick={() => setPaymentOpen(true)}
            >
              {t('payButton', { amount: formatPrice(order.total) })}
            </Button>
          )}

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            leftIcon={<MessageCircle className="h-4 w-4" />}
            onClick={() => router.push('/chat')}
          >
            {t('helpButton')}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            leftIcon={<Send className="h-4 w-4" />}
            onClick={() => window.open('https://t.me/DeftMotoBot', '_blank')}
          >
            {t('telegramBotButton')}
          </Button>
        </aside>
      </div>

      {paymentReq && (
        <PaymentProcessor
          open={paymentOpen}
          request={paymentReq}
          onClose={() => setPaymentOpen(false)}
        />
      )}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  title,
  lines,
}: {
  icon: typeof User;
  title: string;
  lines: string[];
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
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
            className={i === 0 ? 'text-sm font-bold' : 'mt-0.5 text-xs text-white/65'}
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
