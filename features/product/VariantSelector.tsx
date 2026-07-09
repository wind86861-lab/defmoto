'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useHaptic } from '@/hooks/useHaptic';
import type { ProductVariant } from '@/types/product';

interface VariantSelectorProps {
  variants?: ProductVariant[];
  quantity: number;
  onQuantityChange: (n: number) => void;
  selectedVariantId: string | null;
  onVariantChange: (id: string) => void;
}

export function VariantSelector({
  variants,
  quantity,
  onQuantityChange,
  selectedVariantId,
  onVariantChange,
}: VariantSelectorProps) {
  const t = useTranslations('product');
  const { selection, impact } = useHaptic();

  const colors = useMemo(() => {
    if (!variants) return [];
    const seen = new Map<string, { color: string; hex: string }>();
    for (const v of variants) {
      if (v.color && v.colorHex && !seen.has(v.colorHex)) {
        seen.set(v.colorHex, { color: v.color, hex: v.colorHex });
      }
    }
    return Array.from(seen.values());
  }, [variants]);

  const selectedVariant = variants?.find((v) => v.id === selectedVariantId);
  const selectedColor = selectedVariant?.colorHex;

  const setColor = (hex: string) => {
    selection();
    const first = variants?.find((v) => v.colorHex === hex);
    if (first) onVariantChange(first.id);
  };

  const maxStock = selectedVariant?.stock ?? 99;

  return (
    <div className="space-y-5">
      {colors.length > 0 && (
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/45">
              {t('colorLabel')}
            </span>
            {selectedVariant?.color && (
              <span className="text-xs font-semibold text-white">
                {selectedVariant.color}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map(({ color, hex }) => {
              const active = hex === selectedColor;
              const lightish = ['#F5F5F5', '#FFB800', '#FFD700'].includes(hex);
              return (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColor(hex)}
                  aria-label={color}
                  title={color}
                  className={cn(
                    'relative h-11 w-11 rounded-xl border-2 transition-all touch-feedback',
                    active
                      ? 'border-brand-yellow shadow-glow-sm'
                      : 'border-brand-surface-border hover:border-white/30',
                  )}
                  style={{ background: hex }}
                >
                  {active && (
                    <Check
                      className={cn(
                        'absolute inset-0 m-auto h-4 w-4',
                        lightish ? 'text-brand-dark' : 'text-white',
                      )}
                      strokeWidth={3}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-white/45">
            {t('quantityLabel')}
          </span>
          {selectedVariant && (
            <span className="text-xs text-white/55">
              {t('inStockCountLabel')} <span className="font-bold text-white">{maxStock}</span>
            </span>
          )}
        </div>
        <div className="inline-flex items-center gap-0 overflow-hidden rounded-xl border border-brand-surface-border bg-brand-surface">
          <button
            type="button"
            onClick={() => {
              impact('light');
              onQuantityChange(Math.max(1, quantity - 1));
            }}
            disabled={quantity <= 1}
            aria-label={t('decreaseAria')}
            className="flex h-11 w-11 items-center justify-center text-white/85 transition-colors hover:bg-white/8 disabled:opacity-30"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="flex h-11 min-w-[56px] items-center justify-center border-x border-brand-surface-border px-3 font-display text-base font-bold">
            {quantity}
          </div>
          <button
            type="button"
            onClick={() => {
              impact('light');
              onQuantityChange(Math.min(maxStock, quantity + 1));
            }}
            disabled={quantity >= maxStock}
            aria-label={t('increaseAria')}
            className="flex h-11 w-11 items-center justify-center text-white/85 transition-colors hover:bg-white/8 disabled:opacity-30"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
