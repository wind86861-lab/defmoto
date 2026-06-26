export interface PromoCode {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minSubtotal?: number;
  description: string;
}

export const mockPromoCodes: PromoCode[] = [
  { code: 'DEFT10', type: 'percent', value: 10, description: "10% chegirma" },
  { code: 'WELCOME', type: 'fixed', value: 50000, minSubtotal: 300000, description: "50 000 so'm chegirma (300 000+)" },
  { code: 'MOTO20', type: 'percent', value: 20, minSubtotal: 1000000, description: "20% chegirma (1 mln+)" },
];

export interface PromoResult {
  ok: boolean;
  code?: PromoCode;
  discount: number;
  error?: string;
}

export function applyPromo(input: string, subtotal: number): PromoResult {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return { ok: false, discount: 0, error: "Promokod kiriting" };

  const match = mockPromoCodes.find((p) => p.code.toUpperCase() === trimmed);
  if (!match) return { ok: false, discount: 0, error: "Promokod topilmadi" };

  if (match.minSubtotal && subtotal < match.minSubtotal) {
    return {
      ok: false,
      discount: 0,
      error: `Minimal summa: ${match.minSubtotal.toLocaleString()} so'm`,
    };
  }

  const discount =
    match.type === 'percent'
      ? Math.round((subtotal * match.value) / 100)
      : match.value;

  return { ok: true, code: match, discount };
}
