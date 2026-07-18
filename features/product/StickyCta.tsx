'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ShoppingBag, Heart } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/format';
import { productName } from '@/lib/productLocale';
import { useWishlistStore } from '@/lib/stores/wishlist';
import { useHaptic } from '@/hooks/useHaptic';
import { useMounted } from '@/hooks/useMounted';
import { useToast } from '@/components/ui/Toaster';
import type { Product } from '@/types/product';

interface StickyCtaProps {
  product: Product;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

export function StickyCta({ product, onAddToCart, onBuyNow }: StickyCtaProps) {
  const t = useTranslations('product');
  const locale = useLocale();
  const name = productName(product, locale);
  const [visible, setVisible] = useState(false);
  const mounted = useMounted();
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore(
    (s) => mounted && s.ids.includes(product.id),
  );
  const { impact } = useHaptic();
  const toast = useToast();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-16 z-40 transition-all duration-300 ease-spring safe-bottom md:hidden',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
      )}
    >
      <div className="mx-3 mb-2 flex items-center gap-2 rounded-2xl border border-brand-surface-border bg-brand-dark/95 p-2 shadow-card-hover backdrop-blur-xl">
        <button
          type="button"
          onClick={() => {
            impact('light');
            const was = isWishlisted;
            toggleWishlist(product.id);
            if (was) toast.info(t('removedFromWishlistTitle'), name);
            else toast.wishlist(t('addedToWishlistTitle'), name);
          }}
          aria-label={t('wishlistAria')}
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors touch-feedback',
            isWishlisted
              ? 'bg-brand-yellow text-brand-dark shadow-glow-sm'
              : 'border border-brand-surface-border bg-brand-surface text-white',
          )}
        >
          <Heart className="h-5 w-5" fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[10px] uppercase text-white/45">{t('priceLabel')}</span>
          <span className="truncate font-display text-base font-extrabold text-brand-yellow">
            {formatPrice(product.price)}
          </span>
        </div>

        <Button
          size="md"
          variant="secondary"
          leftIcon={<ShoppingBag className="h-4 w-4" />}
          onClick={onAddToCart}
        >
          {t('addToCartShortButton')}
        </Button>
        <Button size="md" onClick={onBuyNow}>
          {t('buyNowButton')}
        </Button>
      </div>
    </div>
  );
}
