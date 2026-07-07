'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeliveryMethod, PaymentMethod } from '@/types/order';

export interface CheckoutState {
  step: number;
  contact: { name: string; phone: string };
  delivery: {
    method: DeliveryMethod;
    branchId?: string;
    // BTS pickup branch (method === 'bts').
    btsRegionCode?: string;
    btsRegionName?: string;
    btsCityCode?: string;
    btsCityName?: string;
    btsBranchCode?: string;
    btsBranchName?: string;
    btsBranchAddress?: string;
    btsPrice?: number;
  };
  address: {
    city: string;
    street: string;
    apartment?: string;
    note?: string;
  };
  payment: { method: PaymentMethod };
  promoCode?: string;

  setStep: (s: number) => void;
  setContact: (c: Partial<CheckoutState['contact']>) => void;
  setDelivery: (d: Partial<CheckoutState['delivery']>) => void;
  setAddress: (a: Partial<CheckoutState['address']>) => void;
  setPayment: (p: Partial<CheckoutState['payment']>) => void;
  reset: () => void;
}

const initial = {
  step: 0,
  contact: { name: '', phone: '' },
  delivery: { method: 'pickup' as DeliveryMethod, branchId: undefined },
  address: { city: 'Toshkent', street: '', apartment: '', note: '' },
  payment: { method: 'click' as PaymentMethod },
};

export const useCheckoutState = create<CheckoutState>()(
  persist(
    (set) => ({
      ...initial,
      setStep: (s) => set({ step: s }),
      setContact: (c) =>
        set((state) => ({ contact: { ...state.contact, ...c } })),
      setDelivery: (d) =>
        set((state) => ({ delivery: { ...state.delivery, ...d } })),
      setAddress: (a) =>
        set((state) => ({ address: { ...state.address, ...a } })),
      setPayment: (p) =>
        set((state) => ({ payment: { ...state.payment, ...p } })),
      reset: () => set(initial),
    }),
    { name: 'deftmoto-checkout' },
  ),
);
