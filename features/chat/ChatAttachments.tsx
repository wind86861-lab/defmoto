'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ShoppingBag, MapPin, Wrench, ArrowRight } from 'lucide-react';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatPrice } from '@/lib/format';
import { useCartStore } from '@/lib/stores/cart';
import { useHaptic } from '@/hooks/useHaptic';
import type { ChatAttachment } from '@/types/chat';

export function ChatAttachmentView({ attachment }: { attachment: ChatAttachment }) {
  switch (attachment.kind) {
    case 'image':
      return <ImageAttachment src={attachment.url} alt={attachment.alt} />;
    case 'video':
      return <VideoAttachment src={attachment.url} />;
    case 'product':
      return <ProductLinkCard attachment={attachment} />;
    case 'service':
      return <ServiceLinkCard attachment={attachment} />;
  }
}

function ImageAttachment({ src, alt }: { src: string; alt?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-surface-border bg-brand-dark">
      <ProductImage
        src={src}
        alt={alt ?? ''}
        className="max-h-72 w-full object-cover"
        fallbackClassName="h-48 w-full"
      />
    </div>
  );
}

function VideoAttachment({ src }: { src: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-surface-border bg-brand-dark">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        className="max-h-80 w-full bg-black object-contain"
      />
    </div>
  );
}

function ProductLinkCard({
  attachment,
}: {
  attachment: Extract<ChatAttachment, { kind: 'product' }>;
}) {
  const t = useTranslations('chat');
  const addToCart = useCartStore((s) => s.add);
  const { notify } = useHaptic();

  return (
    <article className="overflow-hidden rounded-2xl border border-brand-yellow/30 bg-brand-surface shadow-glow-sm">
      <Link href={`/product/${attachment.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-brand-dark">
          <ProductImage
            src={attachment.image}
            alt={attachment.name}
            className="h-full w-full object-cover"
            fallbackClassName="h-full w-full"
          />
          <div className="absolute right-2 top-2 rounded-md bg-brand-dark/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-yellow backdrop-blur-md">
            {t('productBadge')}
          </div>
        </div>
      </Link>

      <div className="p-3">
        {attachment.brand && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
            {attachment.brand}
          </p>
        )}
        <Link href={`/product/${attachment.slug}`}>
          <h4 className="mt-0.5 line-clamp-2 text-sm font-bold leading-tight hover:text-brand-yellow">
            {attachment.name}
          </h4>
        </Link>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            {attachment.oldPrice && attachment.oldPrice > attachment.price && (
              <div className="text-[10px] text-white/40 line-through">
                {formatPrice(attachment.oldPrice)}
              </div>
            )}
            <div className="truncate font-display text-sm font-extrabold text-brand-yellow">
              {formatPrice(attachment.price)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              notify('success');
              addToCart({
                productId: attachment.productId,
                name: attachment.name,
                image: attachment.image,
                price: attachment.price,
                oldPrice: attachment.oldPrice,
              });
            }}
            aria-label={t('addToCartAria')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-yellow text-brand-dark shadow-glow-sm transition-all hover:brightness-110 touch-feedback"
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </article>
  );
}

function ServiceLinkCard({
  attachment,
}: {
  attachment: Extract<ChatAttachment, { kind: 'service' }>;
}) {
  const t = useTranslations('chat');
  return (
    <Link
      href="/service"
      className="group block overflow-hidden rounded-2xl border border-info/40 bg-gradient-to-br from-brand-surface to-brand-dark p-4 transition-all hover:border-info/70"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-info/15 text-info">
          <Wrench className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-info">
            {t('serviceCenterLabel')}
          </p>
          <h4 className="mt-0.5 text-sm font-bold leading-tight">
            {attachment.centerName}
          </h4>
          <p className="mt-1 flex items-center gap-1 text-xs text-white/55">
            <MapPin className="h-3 w-3" />
            {attachment.address}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-info" />
      </div>
    </Link>
  );
}
