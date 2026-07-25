export interface PromoCode {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  /** Minimum order subtotal for the code to apply (so'm). Optional. */
  minSubtotal?: number;
  description: string;
}

export interface PromoResult {
  ok: boolean;
  code?: PromoCode;
  discount: number;
  error?: string;
}

/**
 * Validate a promo code against the admin-managed list.
 *
 * There are NO built-in / demo codes: only codes the admin created ever apply.
 * `codes` comes from the content store (useContentStore(s => s.promoCodes)).
 */
export function applyPromo(input: string, subtotal: number, codes: PromoCode[]): PromoResult {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return { ok: false, discount: 0, error: 'Promokod kiriting' };

  const match = (codes || []).find((p) => p.code.trim().toUpperCase() === trimmed);
  if (!match) return { ok: false, discount: 0, error: 'Promokod topilmadi' };

  if (match.minSubtotal && subtotal < match.minSubtotal) {
    return {
      ok: false,
      discount: 0,
      error: `Minimal buyurtma summasi: ${match.minSubtotal.toLocaleString('ru-RU')} so'm`,
    };
  }

  const rawDiscount =
    match.type === 'percent' ? Math.round((subtotal * match.value) / 100) : match.value;
  // Never discount below zero or beyond the order value.
  const discount = Math.max(0, Math.min(rawDiscount, subtotal));

  return { ok: true, code: match, discount };
}
