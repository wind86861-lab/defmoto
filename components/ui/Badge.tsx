import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'yellow' | 'dark' | 'success' | 'danger' | 'outline';
type Size = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  yellow: 'bg-brand-yellow text-brand-dark font-bold',
  dark: 'bg-brand-dark/80 text-white backdrop-blur',
  success: 'bg-success/15 text-success border border-success/30',
  danger: 'bg-danger/15 text-danger border border-danger/30',
  outline: 'border border-brand-surface-border text-white/80',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-5 px-1.5 text-[10px] rounded-md',
  md: 'h-6 px-2 text-xs rounded-lg',
};

export function Badge({
  variant = 'yellow',
  size = 'md',
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-semibold uppercase tracking-wide',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
