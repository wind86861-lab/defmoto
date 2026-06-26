import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  quantity: number;
  variant?: { color?: string; size?: string };
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  clear: () => void;
  totalAmount: () => number;
  totalCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: i.quantity + qty } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: qty }] };
        }),
      remove: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      setQuantity: (productId, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) =>
                  i.productId === productId ? { ...i, quantity: qty } : i,
                ),
        })),
      clear: () => set({ items: [] }),
      totalAmount: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'deftmoto-cart' },
  ),
);
