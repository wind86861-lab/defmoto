import type {
  PaymentAdapter,
  PaymentRequest,
  PaymentResult,
  PaymentStatus,
} from '@/types/payment';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ===================== real provider redirect (go-live) =====================
 * When the merchant ids are configured (NEXT_PUBLIC_* build vars) we redirect
 * the buyer to the real Payme / Click checkout page. The provider then calls
 * our server callback (/api/payment/payme | /api/payment/click) which marks the
 * order paid, and finally returns the buyer to /order/<id>/success.
 * Until the ids are set, we fall back to the simulated flow below so the demo
 * keeps working. Requires HTTPS in production.
 */
const PAYME_MERCHANT_ID = process.env.NEXT_PUBLIC_PAYME_MERCHANT_ID || '';
const CLICK_SERVICE_ID = process.env.NEXT_PUBLIC_CLICK_SERVICE_ID || '';
const CLICK_MERCHANT_ID = process.env.NEXT_PUBLIC_CLICK_MERCHANT_ID || '';

function returnUrl(orderId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/order/${orderId}/success`;
}

/** Payme checkout URL — params are base64-encoded. Amount in tiyin (so'm×100). */
function paymeCheckoutUrl(req: PaymentRequest): string {
  const amountTiyin = Math.round(req.amount * 100);
  const params =
    `m=${PAYME_MERCHANT_ID};ac.order_id=${req.orderId};a=${amountTiyin};` +
    `c=${returnUrl(req.orderId)}`;
  const encoded =
    typeof window !== 'undefined'
      ? window.btoa(params)
      : Buffer.from(params).toString('base64');
  return `https://checkout.paycom.uz/${encoded}`;
}

/** Click checkout URL. transaction_param becomes our order id in the callback. */
function clickCheckoutUrl(req: PaymentRequest): string {
  const p = new URLSearchParams({
    service_id: CLICK_SERVICE_ID,
    merchant_id: CLICK_MERCHANT_ID,
    amount: String(req.amount),
    transaction_param: req.orderId,
    return_url: returnUrl(req.orderId),
  });
  return `https://my.click.uz/services/pay?${p.toString()}`;
}

/** Redirect the buyer to a provider checkout page. Never resolves (page unloads). */
function redirectTo(url: string, onStatus: (s: PaymentStatus) => void): Promise<PaymentResult> {
  onStatus('redirecting');
  if (typeof window !== 'undefined') window.location.href = url;
  return new Promise<PaymentResult>(() => {});
}

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
    CLICK_SERVICE_ID && CLICK_MERCHANT_ID
      ? redirectTo(clickCheckoutUrl(req), onStatus)
      : simulatePaymentFlow(req, onStatus, {
          redirectMs: 1100,
          pendingMs: 1300,
          processingMs: 1800,
        }),
};

export const paymeAdapter: PaymentAdapter = {
  method: 'payme',
  label: 'Payme',
  pay: (req, onStatus) =>
    PAYME_MERCHANT_ID
      ? redirectTo(paymeCheckoutUrl(req), onStatus)
      : simulatePaymentFlow(req, onStatus, {
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
