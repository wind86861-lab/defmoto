'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ProductImage } from '@/components/ui/ProductImage';

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const t = useTranslations('product');
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollTo = useCallback(
    (idx: number) => emblaApi?.scrollTo(idx),
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl border border-brand-surface-border bg-brand-surface">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {images.map((src, i) => (
              <div key={i} className="relative flex-[0_0_100%]">
                <div className="aspect-square">
                  <ProductImage
                    src={src}
                    alt={`${alt} - ${i + 1}`}
                    className="h-full w-full object-cover"
                    fallbackClassName="h-full w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Counter pill */}
        <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-brand-dark/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
          {selectedIndex + 1} / {images.length}
        </div>

        {/* Arrows — desktop only */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              aria-label={t('prevAria')}
              className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand-surface-border bg-brand-dark/70 text-white backdrop-blur-md transition-all hover:border-brand-yellow/60 hover:bg-brand-dark/90 md:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              aria-label={t('nextAria')}
              className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand-surface-border bg-brand-dark/70 text-white backdrop-blur-md transition-all hover:border-brand-yellow/60 hover:bg-brand-dark/90 md:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Mobile dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 md:hidden">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={t('slideAria', { number: i + 1 })}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === selectedIndex
                    ? 'w-6 bg-brand-yellow shadow-glow-sm'
                    : 'w-1.5 bg-white/40',
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 scrollbar-hide">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={t('thumbnailAria', { number: i + 1 })}
              className={cn(
                'relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                i === selectedIndex
                  ? 'border-brand-yellow shadow-glow-sm'
                  : 'border-brand-surface-border opacity-70 hover:opacity-100',
              )}
            >
              <ProductImage
                src={src}
                alt=""
                className="h-full w-full object-cover"
                fallbackClassName="h-full w-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
