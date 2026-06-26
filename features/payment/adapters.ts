import type {
  PaymentAdapter,
  PaymentRequest,
  PaymentResult,
  PaymentStatus,
} from '@/types/payment';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// === Mock helper: simulates a realistic provider flow ===
// Stages: redirecting → pending → processing → success
// Backend swap: replace this with real provider SDK calls (initPayment, pollStatus...)
async function simulatePaymentFlow(
  req: PaymentRequest,
  onStatus: (s: PaymentStatus) => void,
  options: {
    redirectMs?: number;
    pendingMs?: number;
    processingMs?: number;
    successRate?: number;
  } = {},
): Promise<PaymentResult> {
  const {
    redirectMs = 1200,
    pendingMs = 1400,
    processingMs = 1800,
    successRate = 0.9,
  } = options;

  onStatus('redirecting');
  await wait(redirectMs);

  onStatus('pending');
  await wait(pendingMs);

  onStatus('processing');
  await wait(processingMs);

  // Random success based on rate (90% by default)
  const ok = Math.random() < successRate;

  if (ok) {
    onStatus('success');
    return {
      ok: true,
      status: 'success',
      transactionId: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
  }

  onStatus('failed');
  return {
    ok: false,
    status: 'failed',
    error: {
      code: 'insufficient_funds',
    },
  };
}

export const clickAdapter: PaymentAdapter = {
  method: 'click',
  label: 'Click',
  pay: (req, onStatus) =>
    simulatePaymentFlow(req, onStatus, {
      redirectMs: 1100,
      pendingMs: 1300,
      processingMs: 1800,
    }),
};

export const paymeAdapter: PaymentAdapter = {
  method: 'payme',
  label: 'Payme',
  pay: (req, onStatus) =>
    simulatePaymentFlow(req, onStatus, {
      redirectMs: 1000,
      pendingMs: 1500,
      processingMs: 1700,
    }),
};

export const btsAdapter: PaymentAdapter = {
  method: 'bts',
  label: 'BTS Pay',
  pay: (req, onStatus) =>
    simulatePaymentFlow(req, onStatus, {
      redirectMs: 1300,
      pendingMs: 1700,
      processingMs: 2000,
    }),
};

// Cash — no online flow; we just mark as pending until courier collects
export const cashAdapter: PaymentAdapter = {
  method: 'cash',
  label: "Naqd to'lov",
  pay: async (_req, onStatus) => {
    onStatus('processing');
    await wait(800);
    onStatus('success');
    return {
      ok: true,
      status: 'success',
      transactionId: `cash_${Date.now()}`,
    };
  },
};

export const adapters: Record<PaymentAdapter['method'], PaymentAdapter> = {
  click: clickAdapter,
  payme: paymeAdapter,
  bts: btsAdapter,
  cash: cashAdapter,
};

export function getAdapter(method: PaymentAdapter['method']): PaymentAdapter {
  return adapters[method];
}
