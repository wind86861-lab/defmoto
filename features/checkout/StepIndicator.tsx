'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

interface StepIndicatorProps {
  steps: string[];
  current: number;
  onStepClick?: (i: number) => void;
}

export function StepIndicator({ steps, current, onStepClick }: StepIndicatorProps) {
  return (
    <div className="relative">
      {/* Progress line */}
      <div className="absolute left-0 right-0 top-4 h-0.5 bg-brand-surface-border" />
      <div
        className="absolute left-0 top-4 h-0.5 bg-gradient-yellow shadow-glow-sm transition-all duration-500 ease-spring"
        style={{ width: `${(current / (steps.length - 1)) * 100}%` }}
      />

      <ol className="relative flex justify-between">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          const clickable = onStepClick && i < current;
          return (
            <li key={label} className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => clickable && onStepClick?.(i)}
                disabled={!clickable}
                className={cn(
                  'relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all',
                  done && 'border-brand-yellow bg-brand-yellow text-brand-dark shadow-glow-sm',
                  active &&
                    'border-brand-yellow bg-brand-dark text-brand-yellow shadow-glow-sm',
                  !done && !active && 'border-brand-surface-border bg-brand-surface text-white/40',
                  clickable && 'cursor-pointer',
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <span className="text-xs font-bold">{i + 1}</span>
                )}
              </button>
              <span
                className={cn(
                  'hidden text-center text-[11px] font-semibold sm:block',
                  active ? 'text-brand-yellow' : 'text-white/45',
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
