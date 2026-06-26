import type { CartItem } from '@/lib/stores/cart';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'shipping'
  | 'delivered'
  | 'cancelled';

export type DeliveryMethod = 'courier' | 'pickup' | 'post';
export type PaymentMethod = 'click' | 'payme' | 'bts' | 'cash';

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  status: OrderStatus;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  promoCode?: string;
  delivery: {
    method: DeliveryMethod;
    branchId?: string;
    address?: {
      city: string;
      street: string;
      apartment?: string;
      note?: string;
    };
  };
  payment: {
    method: PaymentMethod;
    paid: boolean;
  };
  contact: {
    name: string;
    phone: string;
  };
}
