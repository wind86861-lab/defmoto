'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Star, ShoppingBag, Heart, Share2 } from 'lucide-react';
import { PriceCompare } from '@/components/features/PriceCompare';
import { MarketplaceDealBanner } from '@/components/features/MarketplaceDealBanner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/features/ProductCard';
import { SectionHeader } from '@/components/features/SectionHeader';
import { Reveal } from '@/components/ui/Reveal';
import { formatPrice } from '@/lib/format';
import { useCartStore } from '@/lib/stores/cart';
import { useWishlistStore } from '@/lib/stores/wishlist';
import { useHaptic } from '@/hooks/useHaptic';
import { useMounted } from '@/hooks/useMounted';
import { useProductReviews } from '@/hooks/useProductReviews';
import { useToast } from '@/components/ui/Toaster';
import { ProductGallery } from './ProductGallery';
import { VariantSelector } from './VariantSelector';
import { ProductInfo } from './ProductInfo';
import { StickyCta } from './StickyCta';
import type { Product } from '@/types/product';

interface Props {
  product: Product;
  similar: Product[];
}

export function ProductPageClient({ product, similar }: Props) {
  const t = useTranslations('product');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const toast = useToast();
  const mounted = useMounted();
  const addToCart = useCartStore((s) => s.add);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore(
    (s) => mounted && s.ids.includes(product.id),
  );
  const { notify, impact } = useHaptic();
  const reviews = useProductReviews(product.id);
  const reviewSummary = reviews.data.summary;

  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState<string | null>(
    product.variants?.[0]?.id ?? null,
  );

  const handleAddToCart = (qty = quantity, opts?: { silent?: boolean }) => {
    notify('success');
    addToCart(
      {
        productId: product.id,
        name: product.name,
        image: product.images[0],
        price: product.price,
        oldPrice: product.oldPrice,
        variant: undefined,
      },
      qty,
    );
    if (!opts?.silent) {
      toast.cart(t('addedToCartTitle'), product.name, {
        label: t('goToCartAction'),
        onClick: () => router.push('/cart'),
      });
    }
  };

  // "Sotib olish" — 1 dona qo'shadi va savatga yo'naltiradi
  const handleBuyNow = () => {
    handleAddToCart(1, { silent: true });
    router.push('/cart');
  };

  const handleToggleWishlist = () => {
    impact('light');
    const wasWishlisted = isWishlisted;
    toggleWishlist(product.id);
    if (wasWishlisted) {
      toast.info(t('removedFromWishlistTitle'), product.name);
    } else {
      toast.wishlist(t('addedToWishlistTitle'), product.name);
    }
  };

  const handleShare = async () => {
    impact('light');
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `${product.name} — ${formatPrice(product.price)}`,
          url: window.location.href,
        });
      } catch {
        /* user cancelled */
      }
    }
  };

  const discountPct =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0;

  const maxCompetitor = product.competitorPrices?.length
    ? Math.max(...product.competitorPrices.map((c) => c.price))
    : 0;
  const marketSavings = maxCompetitor > product.price ? maxCompetitor - product.price : 0;
  const savingsText = marketSavings
    ? formatPrice(marketSavings).replace(/[^\d\s]/g, '').trim()
    : '';

  return (
    <div className="mx-auto max-w-7xl px-4 pb-32 pt-6 sm:px-6 sm:pb-10 sm:pt-10">
      <div className="grid gap-8 md:grid-cols-2 md:gap-10 lg:gap-12">
        {/* Left — Gallery */}
        <div>
          <ProductGallery images={product.images} alt={product.name} />
        </div>

        {/* Right — Info */}
        <div className="space-y-5">
          {/* Brand + actions */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {product.brand && (
                <span className="text-xs font-bold uppercase tracking-wider text-white/45">
                  {product.brand}
                </span>
              )}
              <h1 className="mt-1 font-display text-display-sm font-extrabold leading-tight sm:text-display-md">
                {product.name}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={handleShare}
                aria-label={t('shareAria')}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-surface-border bg-brand-surface text-white/85 transition-colors hover:border-brand-yellow/40 hover:text-brand-yellow touch-feedback"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleToggleWishlist}
                aria-label={t('wishlistAria')}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors touch-feedback ${
                  isWishlisted
                    ? 'border-brand-yellow bg-brand-yellow text-brand-dark shadow-glow-sm'
                    : 'border-brand-surface-border bg-brand-surface text-white/85 hover:border-brand-yellow/40 hover:text-brand-yellow'
                }`}
              >
                <Heart
                  className="h-4 w-4"
                  fill={isWishlisted ? 'currentColor' : 'none'}
                />
              </button>
            </div>
          </div>

          {/* Rating — live from user reviews */}
          <a href="#reviews" className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={
                    i < Math.round(reviewSummary.average)
                      ? 'h-4 w-4 fill-brand-yellow text-brand-yellow'
                      : 'h-4 w-4 text-white/20'
                  }
                />
              ))}
            </div>
            {reviewSummary.count > 0 ? (
              <>
                <span className="font-semibold">{reviewSummary.average.toFixed(1)}</span>
                <span className="text-white/45">
                  {t('reviewsCount', { count: reviewSummary.count })}
                </span>
              </>
            ) : (
              <span className="text-white/45">{t('reviewNoneShort')}</span>
            )}
          </a>

          {/* Badges */}
          {product.badges && (
            <div className="flex flex-wrap gap-1.5">
              {product.badges.map((b) => (
                <Badge key={b} variant="yellow" size="sm">
                  {b}
                </Badge>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-display-md font-extrabold text-brand-yellow">
                {formatPrice(product.price)}
              </span>
              {product.oldPrice && (
                <>
                  <span className="font-display text-lg text-white/40 line-through">
                    {formatPrice(product.oldPrice)}
                  </span>
                  {discountPct > 0 && (
                    <Badge variant="success" size="sm">
                      −{discountPct}%
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>

          {/* USP — "cheaper than marketplaces" banner + price compare */}
          {product.competitorPrices && product.competitorPrices.length > 0 && (
            <>
              {savingsText && <MarketplaceDealBanner savings={savingsText} />}
              <PriceCompare
                ourPrice={product.price}
                competitors={product.competitorPrices}
              />
            </>
          )}

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <VariantSelector
              variants={product.variants}
              quantity={quantity}
              onQuantityChange={setQuantity}
              selectedVariantId={variantId}
              onVariantChange={setVariantId}
            />
          )}

          {/* CTA — Desktop */}
          <div className="hidden grid-cols-2 gap-3 pt-2 sm:grid">
            <Button
              size="xl"
              variant="secondary"
              fullWidth
              leftIcon={<ShoppingBag className="h-5 w-5" />}
              onClick={() => handleAddToCart()}
              disabled={!product.inStock}
            >
              {t('addToCartButton')}
            </Button>
            <Button size="xl" glow fullWidth onClick={handleBuyNow} disabled={!product.inStock}>
              {t('buyNowButton')}
            </Button>
          </div>

          {/* CTA — Mobile (inline, plus sticky on scroll) */}
          <div className="grid grid-cols-2 gap-3 pt-2 sm:hidden">
            <Button
              size="lg"
              variant="secondary"
              fullWidth
              onClick={() => handleAddToCart()}
              disabled={!product.inStock}
            >
              {t('addToCartShortButton')}
            </Button>
            <Button size="lg" glow fullWidth onClick={handleBuyNow} disabled={!product.inStock}>
              {t('buyNowButton')}
            </Button>
          </div>
        </div>
      </div>

      {/* Info tabs */}
      <div id="reviews" className="scroll-mt-20">
        <Reveal direction="up" className="mt-14">
          <ProductInfo product={product} reviews={reviews} />
        </Reveal>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <Reveal direction="up" className="mt-14">
          <SectionHeader
            title={t('similarProductsTitle')}
            href="/catalog"
            hrefLabel={tCommon('viewAll')}
          />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Reveal>
      )}

      {/* Sticky CTA — Mobile only */}
      <StickyCta product={product} onAddToCart={() => handleAddToCart()} onBuyNow={handleBuyNow} />
    </div>
  );
}
