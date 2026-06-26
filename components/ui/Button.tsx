'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useHaptic } from '@/hooks/useHaptic';
import { MotoSpinner } from './MotoLoader';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  glow?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-yellow text-brand-dark font-bold shadow-glow-yellow hover:brightness-110 active:brightness-95',
  secondary:
    'bg-brand-surface-elevated text-white border border-brand-surface-border hover:border-brand-yellow/40 hover:bg-brand-surface',
  ghost: 'bg-transparent text-white hover:bg-white/5 active:bg-white/10',
  danger:
    'bg-danger text-white font-semibold hover:brightness-110 active:brightness-95',
  outline:
    'bg-transparent text-brand-yellow border border-brand-yellow/60 hover:bg-brand-yellow/10 hover:border-brand-yellow',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-[15px] gap-2 rounded-xl',
  lg: 'h-12 px-5 text-base gap-2 rounded-xl',
  xl: 'h-14 px-6 text-lg gap-2.5 rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading,
      fullWidth,
      leftIcon,
      rightIcon,
      glow,
      className,
      children,
      disabled,
      onClick,
      ...props
    },
    ref,
  ) => {
    const { impact } = useHaptic();

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        onClick={(e) => {
          impact('light');
          onClick?.(e);
        }}
        className={cn(
          'inline-flex select-none items-center justify-center font-semibold no-tap-highlight touch-feedback',
          'transition-[transform,background,border,box-shadow,filter] duration-200 ease-spring',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          glow && variant === 'primary' && 'animate-glow-pulse',
          className,
        )}
        {...props}
      >
        {loading ? (
          <MotoSpinner size={18} />
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span className="truncate">{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
