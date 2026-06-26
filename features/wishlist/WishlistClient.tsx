'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { useWishlistStore } from '@/lib/stores/wishlist';
import { useCartStore } from '@/lib/stores/cart';
import { useHaptic } from '@/hooks/useHaptic';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ProductImage } from '@/components/ui/ProductImage';
import { useToast } from '@/components/ui/Toaster';
import { mockProducts } from '@/mocks/products';

export function WishlistClient() {
  const t = useTranslations('wishlist');
  const router = useRouter();
  const toast = useToast();
  const ids = useWishlistStore((s) => s.ids);
  const toggle = useWishlistStore((s) => s.toggle);
  const clear = useWishlistStore((s) => s.clear);
  const addToCart = useCartStore((s) => s.add);
  const { notify, impact } = useHaptic();

  const products = useMemo(
    () => mockProducts.filter((p) => ids.includes(p.id)),
    [ids],
  );

  if (products.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow shadow-glow-sm">
          <Heart className="h-12 w-12" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-display-md font-extrabold">
          {t('emptyTitle')}
        </h1>
        <p className="mt-2 max-w-xs text-sm text-white/55">
          {t('emptyDesc')}
        </p>
        <Link href="/catalog" className="mt-6">
          <Button size="xl" glow>
            {t('goToCatalogButton')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 sm:py-10">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-display-sm font-extrabold sm:text-display-md">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-white/55">{t('itemsCount', { count: products.length })}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            impact('medium');
            clear();
          }}
          className="text-xs font-semibold text-white/55 transition-colors hover:text-danger touch-feedback"
        >
          {t('clearButton')}
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <article
            key={p.id}
            className="flex gap-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-3"
          >
            <Link href={`/product/${p.slug}`} className="shrink-0">
              <ProductImage
                src={p.images[0]}
                alt={p.name}
                className="h-24 w-24 rounded-xl object-cover"
                fallbackClassName="h-24 w-24 rounded-xl"
              />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <Link
                href={`/product/${p.slug}`}
                className="line-clamp-2 text-sm font-semibold leading-tight transition-colors hover:text-brand-yellow"
              >
                {p.name}
              </Link>
              {p.brand && (
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-white/45">
                  {p.brand}
                </p>
              )}
              <div className="mt-auto">
                {p.oldPrice && (
                  <div className="text-[11px] text-white/40 line-through">
                    {formatPrice(p.oldPrice)}
                  </div>
                )}
                <div className="font-display text-base font-extrabold text-brand-yellow">
                  {formatPrice(p.price)}
                </div>
              </div>

              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  fullWidth
                  leftIcon={<ShoppingBag className="h-3.5 w-3.5" />}
                  onClick={() => {
                    notify('success');
                    addToCart({
                      productId: p.id,
                      name: p.name,
                      image: p.images[0],
                      price: p.price,
                      oldPrice: p.oldPrice,
                    });
                    toggle(p.id);
                    toast.cart(t('movedToCartTitle'), p.name, {
                      label: t('goToCartAction'),
                      onClick: () => router.push('/cart'),
                    });
                  }}
                  disabled={!p.inStock}
                >
                  {t('addToCartButton')}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    impact('medium');
                    toggle(p.id);
                    toast.info(t('removedTitle'), p.name);
                  }}
                  aria-label={t('removeAria')}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-surface-border bg-brand-dark/40 text-white/55 transition-colors hover:border-danger/40 hover:text-danger touch-feedback"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
