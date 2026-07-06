/**
 * Payme (Paycom) Merchant API — JSON-RPC 2.0 handler.
 * Docs: https://developer.help.paycom.uz/metody-merchant-api
 *
 * Configure in the Payme cabinet:
 *   Endpoint:  https://<domain>/api/payment/payme
 *   Account field: order_id
 * Env: PAYME_KEY (cashbox key), optional PAYME_ALLOWED_IPS (comma-separated).
 *
 * Amounts from Payme are in tiyin (soʻm × 100).
 */

import {
  getOrder,
  getPaymentById,
  getPaymentByOrder,
  listPayments,
  savePayment,
  updateOrderStatus,
} from '@/lib/db';
import { notifyOperator } from '@/lib/server/chatRelay';
import { notifyOrderStatus } from '@/lib/server/orderNotify';

const KEY = process.env.PAYME_KEY || '';
const TEST_KEY = process.env.PAYME_TEST_KEY || '';

// A created transaction is only valid for 12 hours.
const TIMEOUT_MS = 12 * 60 * 60 * 1000;

// Payme transaction states
const STATE_CREATED = 1;
const STATE_PAID = 2;
const STATE_CANCELLED = -1;
const STATE_CANCELLED_AFTER_PAID = -2;

// Cancel reason for a timed-out transaction.
const REASON_TIMEOUT = 4;

// Error codes
const E = {
  PARSE: -32700,
  METHOD_NOT_FOUND: -32601,
  AUTH: -32504,
  INVALID_AMOUNT: -31001,
  TX_NOT_FOUND: -31003,
  CANT_PERFORM: -31008,
  ORDER_NOT_FOUND: -31050, // account.order_id errors: -31050..-31099
};

interface RpcError {
  code: number;
  message: string | { ru: string; uz: string; en: string };
  data?: unknown;
}

function rpcError(id: unknown, error: RpcError) {
  return { jsonrpc: '2.0', id: id ?? null, error };
}
function rpcResult(id: unknown, result: unknown) {
  return { jsonrpc: '2.0', id: id ?? null, result };
}

function authOk(req: Request): boolean {
  if (!KEY && !TEST_KEY) return false;
  const h = req.headers.get('authorization') || '';
  if (!h.startsWith('Basic ')) return false;
  try {
    const decoded = Buffer.from(h.slice(6), 'base64').toString('utf8');
    // format: "Paycom:<key>" — accept the production OR the sandbox key so the
    // same endpoint works for test.paycom.uz and checkout.paycom.uz.
    const key = decoded.split(':').slice(1).join(':');
    return (Boolean(KEY) && key === KEY) || (Boolean(TEST_KEY) && key === TEST_KEY);
  } catch {
    return false;
  }
}

function orderNotFound(): RpcError {
  return {
    code: E.ORDER_NOT_FOUND,
    message: { ru: 'Заказ не найден', uz: 'Buyurtma topilmadi', en: 'Order not found' },
    data: 'order_id',
  };
}

function tiyin(soum: number): number {
  return Math.round(soum * 100);
}

export async function handlePayme(req: Request): Promise<{ status: number; body: unknown }> {
  let rpc: { method?: string; params?: any; id?: unknown };
  try {
    rpc = await req.json();
  } catch {
    return { status: 200, body: rpcError(null, { code: E.PARSE, message: 'Parse error' }) };
  }

  if (!authOk(req)) {
    return {
      status: 200,
      body: rpcError(rpc.id ?? null, { code: E.AUTH, message: 'Insufficient privileges to perform this method' }),
    };
  }

  const { method, params = {}, id } = rpc;

  switch (method) {
    /* ---------------------------------------------------------------- */
    case 'CheckPerformTransaction': {
      const orderId = params?.account?.order_id;
      const order = orderId ? getOrder(String(orderId)) : null;
      if (!order) return { status: 200, body: rpcError(id, orderNotFound()) };
      if (Number(params.amount) !== tiyin(order.total)) {
        return { status: 200, body: rpcError(id, { code: E.INVALID_AMOUNT, message: 'Incorrect amount' }) };
      }
      return { status: 200, body: rpcResult(id, { allow: true }) };
    }

    /* ---------------------------------------------------------------- */
    case 'CreateTransaction': {
      const txId = String(params.id);
      const orderId = params?.account?.order_id ? String(params.account.order_id) : '';
      const order = orderId ? getOrder(orderId) : null;
      if (!order) return { status: 200, body: rpcError(id, orderNotFound()) };
      if (Number(params.amount) !== tiyin(order.total)) {
        return { status: 200, body: rpcError(id, { code: E.INVALID_AMOUNT, message: 'Incorrect amount' }) };
      }

      const existing = getPaymentById(txId);
      if (existing && existing.provider === 'payme') {
        if (existing.state === STATE_CREATED) {
          // Expired → cancel and refuse.
          if (Date.now() - existing.createTime >= TIMEOUT_MS) {
            existing.state = STATE_CANCELLED;
            existing.reason = REASON_TIMEOUT;
            existing.cancelTime = existing.cancelTime || Date.now();
            savePayment(existing);
            return {
              status: 200,
              body: rpcError(id, {
                code: E.CANT_PERFORM,
                message: { ru: 'Время транзакции истекло', uz: 'Tranzaksiya muddati tugadi', en: 'Transaction timed out' },
              }),
            };
          }
          return {
            status: 200,
            body: rpcResult(id, { create_time: existing.createTime, transaction: existing.id, state: existing.state }),
          };
        }
        // Terminal state → cannot re-create.
        return { status: 200, body: rpcError(id, { code: E.CANT_PERFORM, message: 'Transaction is in a terminal state' }) };
      }

      // Order already has another (active/paid) Payme transaction.
      const byOrder = getPaymentByOrder('payme', orderId);
      if (byOrder && byOrder.id !== txId && (byOrder.state === STATE_CREATED || byOrder.state === STATE_PAID)) {
        return {
          status: 200,
          body: rpcError(id, {
            code: E.ORDER_NOT_FOUND,
            message: { ru: 'Заказ уже оплачивается', uz: 'Buyurtma allaqachon toʻlanmoqda', en: 'Order already has a transaction' },
            data: 'order_id',
          }),
        };
      }

      const rec = savePayment({
        id: txId,
        provider: 'payme',
        orderId,
        amount: order.total,
        state: STATE_CREATED,
        createTime: Date.now(),
        performTime: 0,
        cancelTime: 0,
        reason: null,
        extra: { paymeTime: Number(params.time) || Date.now() },
      });
      return { status: 200, body: rpcResult(id, { create_time: rec.createTime, transaction: rec.id, state: rec.state }) };
    }

    /* ---------------------------------------------------------------- */
    case 'PerformTransaction': {
      const tx = getPaymentById(String(params.id));
      if (!tx || tx.provider !== 'payme') {
        return { status: 200, body: rpcError(id, { code: E.TX_NOT_FOUND, message: 'Transaction not found' }) };
      }
      if (tx.state === STATE_PAID) {
        return { status: 200, body: rpcResult(id, { perform_time: tx.performTime, transaction: tx.id, state: tx.state }) };
      }
      if (tx.state !== STATE_CREATED) {
        return { status: 200, body: rpcError(id, { code: E.CANT_PERFORM, message: 'Cannot perform transaction' }) };
      }
      // Expired created transaction → cancel, refuse.
      if (Date.now() - tx.createTime >= TIMEOUT_MS) {
        tx.state = STATE_CANCELLED;
        tx.reason = REASON_TIMEOUT;
        tx.cancelTime = tx.cancelTime || Date.now();
        savePayment(tx);
        return {
          status: 200,
          body: rpcError(id, {
            code: E.CANT_PERFORM,
            message: { ru: 'Время транзакции истекло', uz: 'Tranzaksiya muddati tugadi', en: 'Transaction timed out' },
          }),
        };
      }
      tx.state = STATE_PAID;
      tx.performTime = Date.now();
      savePayment(tx);
      updateOrderStatus(tx.orderId, 'paid');
      void notifyOrderStatus(tx.orderId, 'paid');
      void notifyOperator(
        `💳 *Toʻlov qabul qilindi (Payme)*\nBuyurtma: ${tx.orderId}\nSumma: ${tx.amount.toLocaleString('ru-RU')} soʻm`,
      );
      return { status: 200, body: rpcResult(id, { perform_time: tx.performTime, transaction: tx.id, state: tx.state }) };
    }

    /* ---------------------------------------------------------------- */
    case 'CancelTransaction': {
      const tx = getPaymentById(String(params.id));
      if (!tx || tx.provider !== 'payme') {
        return { status: 200, body: rpcError(id, { code: E.TX_NOT_FOUND, message: 'Transaction not found' }) };
      }
      if (tx.state === STATE_CREATED) {
        tx.state = STATE_CANCELLED;
        tx.cancelTime = tx.cancelTime || Date.now();
        tx.reason = params.reason != null ? Number(params.reason) : tx.reason;
        savePayment(tx);
        updateOrderStatus(tx.orderId, 'cancelled');
        void notifyOrderStatus(tx.orderId, 'cancelled');
      } else if (tx.state === STATE_PAID) {
        tx.state = STATE_CANCELLED_AFTER_PAID;
        tx.cancelTime = tx.cancelTime || Date.now();
        tx.reason = params.reason != null ? Number(params.reason) : tx.reason;
        savePayment(tx);
        updateOrderStatus(tx.orderId, 'cancelled');
        void notifyOrderStatus(tx.orderId, 'cancelled');
      }
      // Already cancelled → idempotent; just return current state.
      return {
        status: 200,
        body: rpcResult(id, { cancel_time: tx.cancelTime, transaction: tx.id, state: tx.state }),
      };
    }

    /* ---------------------------------------------------------------- */
    case 'CheckTransaction': {
      const tx = getPaymentById(String(params.id));
      if (!tx || tx.provider !== 'payme') {
        return { status: 200, body: rpcError(id, { code: E.TX_NOT_FOUND, message: 'Transaction not found' }) };
      }
      return {
        status: 200,
        body: rpcResult(id, {
          create_time: tx.createTime,
          perform_time: tx.performTime,
          cancel_time: tx.cancelTime,
          transaction: tx.id,
          state: tx.state,
          reason: tx.reason,
        }),
      };
    }

    /* ---------------------------------------------------------------- */
    case 'GetStatement': {
      const from = Number(params.from) || 0;
      const to = Number(params.to) || Date.now();
      const transactions = listPayments()
        .filter((p) => p.provider === 'payme' && p.createTime >= from && p.createTime <= to)
        .map((p) => ({
          id: p.id,
          time: Number((p.extra as { paymeTime?: number })?.paymeTime) || p.createTime,
          amount: tiyin(p.amount),
          account: { order_id: p.orderId },
          create_time: p.createTime,
          perform_time: p.performTime,
          cancel_time: p.cancelTime,
          transaction: p.id,
          state: p.state,
          reason: p.reason,
          receivers: null,
        }));
      return { status: 200, body: rpcResult(id, { transactions }) };
    }

    /* ---------------------------------------------------------------- */
    default:
      return { status: 200, body: rpcError(id, { code: E.METHOD_NOT_FOUND, message: 'Method not found' }) };
  }
}

export function paymeConfigured(): boolean {
  return Boolean(KEY || TEST_KEY);
}
