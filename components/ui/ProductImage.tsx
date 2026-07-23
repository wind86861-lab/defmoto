'use client';

import { useState, type ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ProductImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackClassName?: string;
}

export function ProductImage({
  src,
  alt,
  className,
  fallbackClassName,
  onLoad,
  ...props
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-brand-surface-elevated text-white/30',
          className,
          fallbackClassName,
        )}
      >
        <ImageOff className="h-8 w-8" />
      </div>
    );
  }

  return (
    <img
      // Re-mount on src change so the fade-in replays for the new image.
      key={src}
      src={src}
      alt={alt}
      // Fade in once decoded — no flash of a half-loaded / blurry image.
      className={cn('transition-opacity duration-500 ease-out', loaded ? 'opacity-100' : 'opacity-0', className)}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      // Cache hit: the image may already be complete before React attaches.
      ref={(el) => {
        if (el?.complete) setLoaded(true);
      }}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
