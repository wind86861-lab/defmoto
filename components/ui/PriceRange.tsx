'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';

interface PriceRangeProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
}

export function PriceRange({ min, max, value, onChange, step = 10000 }: PriceRangeProps) {
  const t = useTranslations('common');
  const [internal, setInternal] = useState<[number, number]>(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setInternal(value), [value]);

  const commit = (next: [number, number]) => {
    setInternal(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(next), 200);
  };

  const setLow = (v: number) => {
    const clamped = Math.min(v, internal[1] - step);
    commit([Math.max(min, clamped), internal[1]]);
  };
  const setHigh = (v: number) => {
    const clamped = Math.max(v, internal[0] + step);
    commit([internal[0], Math.min(max, clamped)]);
  };

  const pct = (n: number) => ((n - min) / (max - min)) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-white/45">{t('priceFrom')}</span>
          <span className="font-display text-sm font-bold text-brand-yellow">
            {formatPrice(internal[0])}
          </span>
        </div>
        <div className="h-px flex-1 bg-brand-surface-border" />
        <div className="flex flex-1 flex-col items-end gap-1">
          <span className="text-white/45">{t('priceTo')}</span>
          <span className="font-display text-sm font-bold text-brand-yellow">
            {formatPrice(internal[1])}
          </span>
        </div>
      </div>

      <div className="relative h-6">
        {/* Track */}
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-surface-border" />
        {/* Active range */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-yellow shadow-glow-sm"
          style={{ left: `${pct(internal[0])}%`, right: `${100 - pct(internal[1])}%` }}
        />
        {/* Handles via 2 native sliders stacked */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={internal[0]}
          onChange={(e) => setLow(Number(e.target.value))}
          aria-label={t('minPriceAria')}
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent outline-none',
            '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand-dark',
            '[&::-webkit-slider-thumb]:bg-brand-yellow [&::-webkit-slider-thumb]:shadow-glow-sm',
            '[&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing',
          )}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={internal[1]}
          onChange={(e) => setHigh(Number(e.target.value))}
          aria-label={t('maxPriceAria')}
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent outline-none',
            '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand-dark',
            '[&::-webkit-slider-thumb]:bg-brand-yellow [&::-webkit-slider-thumb]:shadow-glow-sm',
            '[&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing',
          )}
        />
      </div>
    </div>
  );
}
