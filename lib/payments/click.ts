/**
 * Click Merchant API (Shop API) — Prepare + Complete handler.
 * Docs: https://docs.click.uz/en/click-api-request/
 *
 * Configure in the Click cabinet:
 *   Prepare URL:  https://<domain>/api/payment/click
 *   Complete URL: https://<domain>/api/payment/click
 * Env: CLICK_SERVICE_ID, CLICK_SECRET_KEY, optional CLICK_ALLOWED_IPS.
 *
 * Params arrive as application/x-www-form-urlencoded.
 */

import crypto from 'crypto';
import {
  getOrder,
  getPaymentById,
  savePayment,
  updateOrderStatus,
} from '@/lib/db';
import { notifyOperator } from '@/lib/server/chatRelay';

const SERVICE_ID = process.env.CLICK_SERVICE_ID || '';
const SECRET = process.env.CLICK_SECRET_KEY || '';

const ACTION_PREPARE = 0;
const ACTION_COMPLETE = 1;

// Click error codes
const ERR = {
  OK: 0,
  SIGN_FAILED: -1,
  BAD_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ALREADY_PAID: -4,
  ORDER_NOT_FOUND: -5,
  TX_NOT_FOUND: -6,
  CANCELLED: -9,
};

function md5(s: string): string {
  return crypto.createHash('md5').update(s).digest('hex');
}

export function clickConfigured(): boolean {
  return Boolean(SERVICE_ID && SECRET);
}

async function parseParams(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get('content-type') || '';
  const out: Record<string, string> = {};
  try {
    if (ct.includes('application/json')) {
      Object.assign(out, await req.json());
    } else {
      const form = await req.formData();
      for (const [k, v] of form.entries()) out[k] = String(v);
    }
  } catch {
    /* ignore */
  }
  return out;
}

export async function handleClick(req: Request): Promise<unknown> {
  const p = await parseParams(req);

  const clickTransId = p.click_trans_id ?? '';
  const serviceId = p.service_id ?? '';
  const merchantTransId = p.merchant_trans_id ?? ''; // our order id
  const merchantPrepareId = p.merchant_prepare_id ?? '';
  const amount = p.amount ?? '';
  const action = Number(p.action);
  const signTime = p.sign_time ?? '';
  const signString = p.sign_string ?? '';

  const base = (respExtra: Record<string, unknown>) => ({
    click_trans_id: clickTransId,
    merchant_trans_id: merchantTransId,
    ...respExtra,
  });

  // Verify signature
  const signBase =
    action === ACTION_COMPLETE
      ? clickTransId + serviceId + SECRET + merchantTransId + merchantPrepareId + amount + action + signTime
      : clickTransId + serviceId + SECRET + merchantTransId + amount + action + signTime;
  if (!SECRET || md5(signBase) !== signString) {
    return base({ error: ERR.SIGN_FAILED, error_note: 'SIGN CHECK FAILED' });
  }

  const order = merchantTransId ? getOrder(merchantTransId) : null;
  if (!order) {
    return base({ error: ERR.ORDER_NOT_FOUND, error_note: 'Order not found' });
  }
  if (Math.round(Number(amount)) !== Math.round(order.total)) {
    return base({ error: ERR.BAD_AMOUNT, error_note: 'Incorrect amount' });
  }

  if (action === ACTION_PREPARE) {
    const existing = getPaymentById(clickTransId);
    if (existing && existing.state < 0) {
      return base({ error: ERR.CANCELLED, error_note: 'Transaction cancelled' });
    }
    const prepareId = existing?.extra?.prepareId
      ? String(existing.extra.prepareId)
      : String(Date.now());
    savePayment({
      id: clickTransId,
      provider: 'click',
      orderId: merchantTransId,
      amount: order.total,
      state: 1,
      createTime: existing?.createTime ?? Date.now(),
      performTime: 0,
      cancelTime: 0,
      reason: null,
      extra: { prepareId },
    });
    return base({
      merchant_prepare_id: prepareId,
      error: ERR.OK,
      error_note: 'Success',
    });
  }

  if (action === ACTION_COMPLETE) {
    const tx = getPaymentById(clickTransId);
    if (!tx || tx.provider !== 'click') {
      return base({ error: ERR.TX_NOT_FOUND, error_note: 'Transaction not found' });
    }
    if (String(tx.extra?.prepareId ?? '') !== merchantPrepareId) {
      return base({ error: ERR.TX_NOT_FOUND, error_note: 'Prepare id mismatch' });
    }
    // Click sends error < 0 when the payment failed/was cancelled.
    if (Number(p.error) < 0) {
      tx.state = -9;
      tx.cancelTime = Date.now();
      savePayment(tx);
      updateOrderStatus(tx.orderId, 'cancelled');
      return base({ merchant_confirm_id: merchantPrepareId, error: ERR.CANCELLED, error_note: 'Cancelled' });
    }
    if (tx.state === 2) {
      return base({ merchant_confirm_id: merchantPrepareId, error: ERR.ALREADY_PAID, error_note: 'Already paid' });
    }
    tx.state = 2;
    tx.performTime = Date.now();
    savePayment(tx);
    updateOrderStatus(tx.orderId, 'paid');
    void notifyOperator(
      `💳 *Toʻlov qabul qilindi (Click)*\nBuyurtma: ${tx.orderId}\nSumma: ${tx.amount.toLocaleString('ru-RU')} soʻm`,
    );
    return base({ merchant_confirm_id: merchantPrepareId, error: ERR.OK, error_note: 'Success' });
  }

  return base({ error: ERR.ACTION_NOT_FOUND, error_note: 'Action not found' });
}
