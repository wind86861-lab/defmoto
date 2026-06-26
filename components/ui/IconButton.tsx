'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useHaptic } from '@/hooks/useHaptic';

type Variant = 'ghost' | 'solid' | 'yellow';
type Size = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  badge?: number;
  icon: ReactNode;
  label: string;
}

const variantClasses: Record<Variant, string> = {
  ghost: 'bg-transparent text-white hover:bg-white/8 active:bg-white/12',
  solid:
    'bg-brand-surface-elevated text-white border border-brand-surface-border hover:border-brand-yellow/40',
  yellow:
    'bg-gradient-yellow text-brand-dark shadow-glow-sm hover:brightness-110',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 w-9 rounded-lg',
  md: 'h-11 w-11 rounded-xl',
  lg: 'h-12 w-12 rounded-2xl',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { variant = 'ghost', size = 'md', icon, label, badge, className, onClick, ...props },
    ref,
  ) => {
    const { impact } = useHaptic();
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        onClick={(e) => {
          impact('light');
          onClick?.(e);
        }}
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center no-tap-highlight touch-feedback',
          'transition-all duration-200 ease-spring',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/60',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {icon}
        {typeof badge === 'number' && badge > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-yellow px-1 text-[10px] font-bold text-brand-dark shadow-glow-sm">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>
    );
  },
);
IconButton.displayName = 'IconButton';
