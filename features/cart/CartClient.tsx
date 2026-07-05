'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Minus,
  Plus,
  Trash2,
  Tag,
  Check,
  ShoppingBag,
  ArrowRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { useCartStore, type CartItem } from '@/lib/stores/cart';
import { useHaptic } from '@/hooks/useHaptic';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductImage } from '@/components/ui/ProductImage';
import { useToast } from '@/components/ui/Toaster';
import { applyPromo, type PromoResult } from '@/lib/promo';

const DELIVERY_FREE_THRESHOLD = 500_000;
const DELIVERY_FEE = 25_000;

export function CartClient() {
  const t = useTranslations('cart');
  const router = useRouter();
  const toast = useToast();
  const items = useCartStore((s) => s.items);
  const remove = useCartStore((s) => s.remove);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const clear = useCartStore((s) => s.clear);
  const { impact, notify } = useHaptic();

  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<PromoResult | null>(null);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = promo?.ok ? promo.discount : 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const deliveryFee = afterDiscount >= DELIVERY_FREE_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = afterDiscount + deliveryFee;

  const handleApplyPromo = () => {
    const result = applyPromo(promoInput, subtotal);
    setPromo(result);
    if (result.ok && result.code) {
      notify('success');
      toast.success(t('promoAppliedTitle'), `${result.code.code} · ${result.code.description}`);
    } else {
      notify('error');
      toast.error(t('promoErrorTitle'), result.error ?? t('promoNotFound'));
    }
  };

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-32 pt-6 sm:px-6 sm:py-10">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-display-sm font-extrabold sm:text-display-md">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {t('itemCount', { count: items.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            impact('medium');
            clear();
            toast.info(t('clearedTitle'), t('clearedDesc', { count: items.length }));
          }}
          className="text-xs font-semibold text-white/55 transition-colors hover:text-danger touch-feedback"
        >
          {t('clearAll')}
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Items list */}
        <div className="min-w-0 space-y-3">
          {items.map((item) => (
            <CartItemRow
              key={item.productId}
              item={item}
              onQuantityChange={(qty) => setQuantity(item.productId, qty)}
              onRemove={() => {
                remove(item.productId);
                toast.info(t('itemRemovedTitle'), item.name);
              }}
            />
          ))}
        </div>

        {/* Summary */}
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <div className="space-y-4 rounded-3xl border border-brand-surface-border bg-brand-surface p-5">
            <h3 className="font-display text-lg font-bold">{t('summaryTitle')}</h3>

            {/* Promo */}
            <div>
              {!promo?.ok && (
                <>
                  <div className="flex gap-2">
                    <div className="min-w-0 flex-1">
                      <Input
                        placeholder={t('promoPlaceholder')}
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        leftIcon={<Tag className="h-4 w-4" />}
                      />
                    </div>
                    <Button variant="outline" size="lg" onClick={handleApplyPromo} className="shrink-0">
                      {t('promoApply')}
                    </Button>
                  </div>
                  {promo?.error && (
                    <p className="mt-1.5 text-xs text-danger">{promo.error}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {['DEFT10', 'WELCOME'].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setPromoInput(code)}
                        className="rounded-full border border-brand-surface-border bg-brand-dark/40 px-2.5 py-1 text-[11px] font-bold text-white/65 hover:border-brand-yellow/40 hover:text-brand-yellow"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {promo?.ok && promo.code && (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-success/40 bg-success/10 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" strokeWidth={3} />
                    <div>
                      <p className="font-bold text-success">{promo.code.code}</p>
                      <p className="text-[11px] text-white/55">
                        {promo.code.description}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPromo(null);
                      setPromoInput('');
                    }}
                    aria-label={t('removePromo')}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/15"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-brand-surface-border pt-4 text-sm">
              <Row label={t('itemsPrice')} value={formatPrice(subtotal)} />
              {discount > 0 && (
                <Row
                  label={t('discount')}
                  value={`− ${formatPrice(discount)}`}
                  valueClassName="text-success"
                />
              )}
              <Row
                label={t('delivery')}
                value={
                  deliveryFee === 0 ? (
                    <span className="text-success font-bold">{t('free')}</span>
                  ) : (
                    formatPrice(deliveryFee)
                  )
                }
              />
              {deliveryFee > 0 && (
                <p className="text-[11px] text-white/45">
                  {t('freeDeliveryRemaining', {
                    amount: formatPrice(DELIVERY_FREE_THRESHOLD - afterDiscount),
                  })}
                </p>
              )}
            </div>

            <div className="flex items-baseline justify-between border-t border-brand-surface-border pt-4">
              <span className="text-sm font-semibold text-white/65">{t('total')}</span>
              <span className="font-display text-display-sm font-extrabold text-brand-yellow">
                {formatPrice(total)}
              </span>
            </div>

            <Button
              size="xl"
              glow
              fullWidth
              rightIcon={<ArrowRight className="h-5 w-5" />}
              onClick={() => router.push('/checkout')}
            >
              {t('checkout')}
            </Button>

            <Link
              href="/catalog"
              className="block text-center text-xs font-semibold text-white/55 hover:text-brand-yellow"
            >
              {t('continueShopping')}
            </Link>
          </div>
        </aside>
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
      <span className={cn('font-semibold', valueClassName)}>{value}</span>
    </div>
  );
}

function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  onQuantityChange: (n: number) => void;
  onRemove: () => void;
}) {
  const t = useTranslations('cart');
  const { impact } = useHaptic();

  return (
    <div className="group flex gap-2.5 rounded-2xl border border-brand-surface-border bg-brand-surface p-2.5 transition-colors sm:gap-3 sm:p-4">
      <Link href={`/product/${item.productId}`} className="shrink-0">
        <ProductImage
          src={item.image}
          alt={item.name}
          className="h-16 w-16 rounded-xl object-cover sm:h-24 sm:w-24"
          fallbackClassName="h-16 w-16 rounded-xl sm:h-24 sm:w-24"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={`/product/${item.productId}`}
          className="line-clamp-2 text-sm font-semibold leading-tight transition-colors hover:text-brand-yellow"
        >
          {item.name}
        </Link>

        {item.variant && (
          <p className="mt-1 text-xs text-white/55">
            {[item.variant.color, item.variant.size].filter(Boolean).join(' · ')}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2 gap-y-1.5 pt-2">
          <div className="inline-flex shrink-0 items-center gap-0 overflow-hidden rounded-lg border border-brand-surface-border">
            <button
              type="button"
              onClick={() => {
                impact('light');
                onQuantityChange(item.quantity - 1);
              }}
              aria-label={t('decreaseQty')}
              className="flex h-8 w-8 items-center justify-center text-white/85 hover:bg-white/8 sm:h-9 sm:w-9"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <div className="flex h-8 min-w-[34px] items-center justify-center border-x border-brand-surface-border px-1.5 text-sm font-bold sm:h-9 sm:min-w-[40px] sm:px-2">
              {item.quantity}
            </div>
            <button
              type="button"
              onClick={() => {
                impact('light');
                onQuantityChange(item.quantity + 1);
              }}
              aria-label={t('increaseQty')}
              className="flex h-8 w-8 items-center justify-center text-white/85 hover:bg-white/8 sm:h-9 sm:w-9"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="ml-auto text-right">
            {item.oldPrice && item.oldPrice > item.price && (
              <div className="text-[11px] text-white/40 line-through">
                {formatPrice(item.oldPrice * item.quantity)}
              </div>
            )}
            <div className="whitespace-nowrap font-display text-sm font-extrabold text-brand-yellow sm:text-base">
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          impact('medium');
          onRemove();
        }}
        aria-label={t('removeItem')}
        className="shrink-0 self-start text-white/40 transition-colors hover:text-danger touch-feedback"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function EmptyCart() {
  const t = useTranslations('cart');
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow shadow-glow-sm">
        <ShoppingBag className="h-12 w-12" strokeWidth={1.5} />
      </div>
      <h1 className="font-display text-display-md font-extrabold">{t('emptyTitle')}</h1>
      <p className="mt-2 max-w-xs text-sm text-white/55">{t('emptyDesc')}</p>
      <Link href="/catalog" className="mt-6">
        <Button size="xl" glow rightIcon={<ArrowRight className="h-5 w-5" />}>
          {t('emptyCta')}
        </Button>
      </Link>
    </div>
  );
}
