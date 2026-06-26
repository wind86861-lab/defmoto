import type { PaymentMethod } from './order';

export type PaymentStatus =
  | 'idle'
  | 'redirecting'
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed'
  | 'cancelled';

export interface PaymentRequest {
  orderId: string;
  orderNumber: string;
  amount: number;
  method: PaymentMethod;
  phone: string;
  description?: string;
}

export interface PaymentResult {
  ok: boolean;
  status: PaymentStatus;
  transactionId?: string;
  receiptUrl?: string;
  error?: PaymentError;
}

export type PaymentErrorCode =
  | 'insufficient_funds'
  | 'invalid_card'
  | 'network'
  | 'cancelled_by_user'
  | 'timeout'
  | 'unknown';

export interface PaymentError {
  code: PaymentErrorCode;
  message?: string;
}

export interface PaymentAdapter {
  method: PaymentMethod;
  label: string;
  pay: (req: PaymentRequest, onStatus: (s: PaymentStatus) => void) => Promise<PaymentResult>;
}

export interface PaymentProviderMeta {
  method: PaymentMethod;
  name: string;
  color: string;
  bgGradient: string;
  description: string;
  icon: string; // emoji or short label
}

export const paymentProviders: Record<PaymentMethod, PaymentProviderMeta> = {
  click: {
    method: 'click',
    name: 'Click',
    color: '#0066FF',
    bgGradient: 'linear-gradient(135deg, #0066FF 0%, #00C2FF 100%)',
    description: 'Karta yoki Click hisobi orqali',
    icon: 'CK',
  },
  payme: {
    method: 'payme',
    name: 'Payme',
    color: '#37BEE7',
    bgGradient: 'linear-gradient(135deg, #37BEE7 0%, #25D8FF 100%)',
    description: 'Payme ilovasi orqali',
    icon: 'PM',
  },
  bts: {
    method: 'bts',
    name: 'BTS Pay',
    color: '#00B14F',
    bgGradient: 'linear-gradient(135deg, #00B14F 0%, #4ADE80 100%)',
    description: 'BTS hamyon orqali',
    icon: 'BTS',
  },
  cash: {
    method: 'cash',
    name: "Naqd to'lov",
    color: '#FFB800',
    bgGradient: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
    description: 'Kuryerga / filialda olib ketganda',
    icon: '₿',
  },
};
