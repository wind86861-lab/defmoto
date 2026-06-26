'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { useCartStore } from '@/lib/stores/cart';
import { useWishlistStore } from '@/lib/stores/wishlist';
import { useHaptic } from '@/hooks/useHaptic';
import { useMounted } from '@/hooks/useMounted';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { ProductImage } from '@/components/ui/ProductImage';
import { useToast } from '@/components/ui/Toaster';
import type { Product } from '@/types/product';
import type { Locale } from '@/i18n/config';

interface ProductCardProps {
  product: Product;
  variant?: 'grid' | 'compact';
  className?: string;
}

export function ProductCard({ product, variant = 'grid', className }: ProductCardProps) {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const toast = useToast();
  const addToCart = useCartStore((s) => s.add);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const mounted = useMounted();
  const isWishlisted = useWishlistStore((s) => mounted && s.ids.includes(product.id));
  const { impact, notify } = useHaptic();

  const discountPct =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    notify('success');
    addToCart({
      productId: product.id,
      name: product.name,
      image: product.images[0],
      price: product.price,
      oldPrice: product.oldPrice,
    });
    toast.cart('Savatga qo\'shildi', product.name, {
      label: 'Savatga o\'tish',
      onClick: () => router.push('/cart'),
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    impact('light');
    const wasWishlisted = isWishlisted;
    toggleWishlist(product.id);
    if (wasWishlisted) {
      toast.info('Sevimlilardan olib tashlandi', product.name);
    } else {
      toast.wishlist('Sevimlilarga qo\'shildi', product.name);
    }
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-brand-surface-border bg-brand-surface',
        'transition-all duration-300 ease-spring',
        'hover:-translate-y-1 hover:border-brand-yellow/40 hover:shadow-card-hover',
        'no-tap-highlight',
        className,
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-brand-dark">
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-spring group-hover:scale-105"
          fallbackClassName="h-full w-full"
        />

        {/* Top-left badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {discountPct > 0 && (
            <Badge variant="yellow" size="sm">
              −{discountPct}%
            </Badge>
          )}
          {product.isNew && (
            <Badge variant="dark" size="sm">
              NEW
            </Badge>
          )}
          {product.isBestseller && !product.isNew && (
            <Badge variant="dark" size="sm">
              HIT
            </Badge>
          )}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label="Wishlist"
          className={cn(
            'absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all no-tap-highlight',
            isWishlisted
              ? 'bg-brand-yellow text-brand-dark shadow-glow-sm'
              : 'bg-brand-dark/60 text-white hover:bg-brand-dark/80',
          )}
        >
          <Heart
            className="h-4 w-4"
            fill={isWishlisted ? 'currentColor' : 'none'}
            strokeWidth={2}
          />
        </button>

        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-dark/70 backdrop-blur-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              {t('outOfStock')}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {product.brand && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
            {product.brand}
          </span>
        )}

        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-white">
          {product.name}
        </h3>

        {typeof product.rating === 'number' && (
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <Star className="h-3 w-3 fill-brand-yellow text-brand-yellow" />
            <span className="font-semibold text-white/80">{product.rating}</span>
            {product.reviewCount ? (
              <span className="text-white/40">({product.reviewCount})</span>
            ) : null}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="min-w-0 flex-1">
            {product.oldPrice && product.oldPrice > product.price && (
              <div className="text-[11px] text-white/40 line-through">
                {formatPrice(product.oldPrice, locale)}
              </div>
            )}
            <div className="truncate font-display text-base font-extrabold text-brand-yellow">
              {formatPrice(product.price, locale)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!product.inStock}
            aria-label={t('addToCart')}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all no-tap-highlight touch-feedback',
              'bg-gradient-yellow text-brand-dark shadow-glow-sm hover:brightness-110',
              'disabled:opacity-40 disabled:hover:brightness-100',
            )}
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </Link>
  );
}
