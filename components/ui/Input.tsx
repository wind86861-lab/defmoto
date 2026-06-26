'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <div
          className={cn(
            'group flex h-12 items-center gap-2 rounded-xl border bg-brand-surface px-3.5 transition-colors duration-200',
            error
              ? 'border-danger/60 focus-within:border-danger'
              : 'border-brand-surface-border focus-within:border-brand-yellow/60 focus-within:shadow-glow-sm',
          )}
        >
          {leftIcon && (
            <span className="shrink-0 text-white/40 group-focus-within:text-brand-yellow">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'flex-1 bg-transparent text-[15px] text-white placeholder:text-white/35 outline-none',
              className,
            )}
            {...props}
          />
          {rightIcon && <span className="shrink-0 text-white/40">{rightIcon}</span>}
        </div>
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
