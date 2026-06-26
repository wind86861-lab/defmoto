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
  ...props
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

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
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
