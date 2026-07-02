/**
 * Server-side data store — the single source of truth for admin-managed
 * content and customer orders, shared by every visitor.
 *
 * Backed by JSON files under .data/ (atomic writes). Chosen over a native
 * SQLite module because the data is small and edited rarely, and a pure-JS
 * store has zero native-module/ABI risk across Node versions and deploys.
 * State is global (all clients see admin edits) and survives restarts and
 * redeploys (deploy does `git reset --hard`, which leaves untracked files).
 *
 * - `content.json`  →  { [key]: JSON blob }  (products, categories, branches,
 *   serviceCenters, marketplaces, hero, franchise)
 * - `orders.json`   →  OrderRecord[]
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');

interface Store {
  content: Record<string, unknown>;
  orders: OrderRecord[];
  payments: PaymentRecord[];
  loaded: boolean;
}

const globalRef = globalThis as unknown as { __deftStore?: Store };
const store: Store =
  globalRef.__deftStore ??
  (globalRef.__deftStore = { content: {}, orders: [], payments: [], loaded: false });

function load() {
  if (store.loaded) return;
  store.loaded = true;
  try {
    store.content = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
  } catch {
    store.content = {};
  }
  try {
    store.orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch {
    store.orders = [];
  }
  try {
    store.payments = JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf8'));
  } catch {
    store.payments = [];
  }
}

function atomicWrite(file: string, data: unknown) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, file);
}

/* ----------------------------- content blobs ----------------------------- */

export function hasContent(key: string): boolean {
  load();
  return Object.prototype.hasOwnProperty.call(store.content, key);
}

export function getContent<T>(key: string, fallback: T): T {
  load();
  return hasContent(key) ? (store.content[key] as T) : fallback;
}

export function setContent(key: string, value: unknown): void {
  load();
  store.content[key] = value;
  atomicWrite(CONTENT_FILE, store.content);
}

/** Returns the stored blob, seeding it from `seed` on first access. */
export function getOrSeedContent<T>(key: string, seed: T): T {
  load();
  if (!hasContent(key)) {
    setContent(key, seed);
    return seed;
  }
  return getContent(key, seed);
}

/* -------------------------------- orders -------------------------------- */

export interface OrderBts {
  orderId: number; // BTS-side order id
  barcode: string;
  tracking?: string;
  cost?: number;
  statusCode?: number;
  statusName?: string;
  updatedAt: number;
}

export interface OrderRecord {
  id: string;
  number: string;
  status: string;
  customerName?: string;
  phone?: string;
  total: number;
  payload: unknown;
  createdAt: number;
  bts?: OrderBts;
}

export function listOrders(): OrderRecord[] {
  load();
  return [...store.orders].sort((a, b) => b.createdAt - a.createdAt);
}

export function getOrder(id: string): OrderRecord | null {
  load();
  return store.orders.find((o) => o.id === id) ?? null;
}

export function createOrder(input: {
  id?: string;
  number?: string;
  status?: string;
  customerName?: string;
  phone?: string;
  total?: number;
  payload?: unknown;
}): OrderRecord {
  load();
  const now = Date.now();
  const order: OrderRecord = {
    id: input.id || `o_${now}_${Math.random().toString(36).slice(2, 6)}`,
    number: input.number || `#${String(now).slice(-6)}`,
    status: input.status || 'received',
    customerName: input.customerName,
    phone: input.phone,
    total: input.total ?? 0,
    payload: input.payload ?? {},
    createdAt: now,
  };
  store.orders.push(order);
  atomicWrite(ORDERS_FILE, store.orders);
  return order;
}

export function updateOrderStatus(id: string, status: string): boolean {
  load();
  const o = store.orders.find((x) => x.id === id);
  if (!o) return false;
  o.status = status;
  atomicWrite(ORDERS_FILE, store.orders);
  return true;
}

/** Attach/merge BTS shipment info onto an order. */
export function setOrderBts(id: string, bts: Partial<OrderBts>): OrderRecord | null {
  load();
  const o = store.orders.find((x) => x.id === id);
  if (!o) return null;
  o.bts = { ...(o.bts ?? { orderId: 0, barcode: '' }), ...bts, updatedAt: Date.now() } as OrderBts;
  atomicWrite(ORDERS_FILE, store.orders);
  return o;
}

/** Find an order by its BTS-side order id (for webhooks). */
export function getOrderByBtsId(btsOrderId: number): OrderRecord | null {
  load();
  return store.orders.find((o) => o.bts?.orderId === btsOrderId) ?? null;
}

/* ------------------------------- payments ------------------------------- */

export type PaymentProvider = 'payme' | 'click';

export interface PaymentRecord {
  id: string; // provider transaction id
  provider: PaymentProvider;
  orderId: string;
  amount: number; // in soʻm
  state: number; // provider-specific state (Payme: 1 created, 2 paid, -1/-2 cancelled)
  createTime: number;
  performTime: number;
  cancelTime: number;
  reason: number | null;
  extra?: Record<string, unknown>;
}

export function listPayments(): PaymentRecord[] {
  load();
  return [...store.payments].sort((a, b) => b.createTime - a.createTime);
}

export function getPaymentById(id: string): PaymentRecord | null {
  load();
  return store.payments.find((p) => p.id === id) ?? null;
}

export function getPaymentByOrder(
  provider: PaymentProvider,
  orderId: string,
): PaymentRecord | null {
  load();
  return (
    store.payments.find((p) => p.provider === provider && p.orderId === orderId) ??
    null
  );
}

export function savePayment(p: PaymentRecord): PaymentRecord {
  load();
  const idx = store.payments.findIndex((x) => x.id === p.id && x.provider === p.provider);
  if (idx >= 0) store.payments[idx] = p;
  else store.payments.push(p);
  atomicWrite(PAYMENTS_FILE, store.payments);
  return p;
}
