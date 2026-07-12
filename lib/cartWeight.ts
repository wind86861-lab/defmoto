import type { CartItem } from '@/lib/stores/cart';

// Fallback per-item weight (kg) when a product has no weight set, so BTS still
// gets a sane figure instead of 0.
const DEFAULT_ITEM_KG = 1;

/** Total shipment weight (kg) for the cart, rounded to 3 decimals. */
export function cartWeightKg(items: CartItem[]): number {
  const total = items.reduce(
    (sum, i) => sum + (i.weight && i.weight > 0 ? i.weight : DEFAULT_ITEM_KG) * i.quantity,
    0,
  );
  return Math.max(0.1, Math.round(total * 1000) / 1000);
}
