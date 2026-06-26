import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order } from '@/types/order';

interface OrdersState {
  orders: Order[];
  add: (order: Order) => void;
  updateStatus: (id: string, status: Order['status']) => void;
  markPaid: (id: string, transactionId?: string) => void;
  getById: (id: string) => Order | undefined;
  clear: () => void;
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      add: (order) =>
        set((state) => ({ orders: [order, ...state.orders] })),
      updateStatus: (id, status) =>
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        })),
      markPaid: (id) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id
              ? { ...o, status: 'paid', payment: { ...o.payment, paid: true } }
              : o,
          ),
        })),
      getById: (id) => get().orders.find((o) => o.id === id),
      clear: () => set({ orders: [] }),
    }),
    { name: 'deftmoto-orders' },
  ),
);
