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
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

interface Store {
  content: Record<string, unknown>;
  orders: OrderRecord[];
  payments: PaymentRecord[];
  reviews: ReviewRecord[];
  users: UserAccount[];
  loaded: boolean;
}

const globalRef = globalThis as unknown as { __deftStore?: Store };
const store: Store =
  globalRef.__deftStore ??
  (globalRef.__deftStore = {
    content: {},
    orders: [],
    payments: [],
    reviews: [],
    users: [],
    loaded: false,
  });

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
  try {
    store.reviews = JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf8'));
  } catch {
    store.reviews = [];
  }
  try {
    store.users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    store.users = [];
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
  userId?: string; // Telegram user id, when ordered from the Mini App
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
  userId?: string;
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
    userId: input.userId ? String(input.userId) : undefined,
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

/* ------------------------------- reviews -------------------------------- */

export interface ReviewRecord {
  id: string;
  productId: string;
  userId: string; // Telegram user id
  userName: string;
  photoUrl?: string;
  rating: number; // 1..5
  text: string;
  createdAt: number;
}

export interface ReviewSummary {
  average: number; // 1 decimal
  count: number;
  distribution: [number, number, number, number, number]; // counts for 1..5 stars
}

export function listReviews(productId: string): ReviewRecord[] {
  load();
  return store.reviews
    .filter((r) => r.productId === productId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getUserReview(productId: string, userId: string): ReviewRecord | null {
  load();
  return (
    store.reviews.find((r) => r.productId === productId && r.userId === String(userId)) ?? null
  );
}

export function reviewSummary(productId: string): ReviewSummary {
  const list = listReviews(productId);
  const distribution: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  let sum = 0;
  for (const r of list) {
    const s = Math.min(5, Math.max(1, Math.round(r.rating)));
    distribution[s - 1] += 1;
    sum += r.rating;
  }
  const count = list.length;
  const average = count ? Math.round((sum / count) * 10) / 10 : 0;
  return { average, count, distribution };
}

/** Upsert a review — one per (product, user). */
export function saveReview(input: {
  productId: string;
  userId: string;
  userName: string;
  photoUrl?: string;
  rating: number;
  text: string;
}): ReviewRecord {
  load();
  const userId = String(input.userId);
  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
  const existing = store.reviews.find(
    (r) => r.productId === input.productId && r.userId === userId,
  );
  if (existing) {
    existing.rating = rating;
    existing.text = input.text;
    existing.userName = input.userName || existing.userName;
    existing.photoUrl = input.photoUrl ?? existing.photoUrl;
    existing.createdAt = Date.now();
    atomicWrite(REVIEWS_FILE, store.reviews);
    return existing;
  }
  const review: ReviewRecord = {
    id: `rv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    productId: input.productId,
    userId,
    userName: input.userName,
    photoUrl: input.photoUrl,
    rating,
    text: input.text,
    createdAt: Date.now(),
  };
  store.reviews.push(review);
  atomicWrite(REVIEWS_FILE, store.reviews);
  return review;
}

/** Has this Telegram user purchased this product (in any of their orders)? */
export function userPurchasedProduct(userId: string, productId: string): boolean {
  load();
  const uid = String(userId);
  return store.orders.some((o) => {
    if (String(o.userId ?? '') !== uid) return false;
    const items = (o.payload as { items?: { productId?: string }[] } | null)?.items;
    return Array.isArray(items) && items.some((it) => String(it?.productId) === productId);
  });
}

/* ---------------------------- user accounts ----------------------------- */

export interface UserAccount {
  id: string;
  phone: string; // normalized digits
  name: string;
  passwordHash: string;
  telegramId?: string;
  createdAt: number;
}

function normPhone(raw: string): string {
  return (raw || '').replace(/\D/g, '');
}

export function getUserByPhone(phone: string): UserAccount | null {
  load();
  // Match on the last 9 digits so "+998 90 111 22 33" and "901112233" are the
  // same account regardless of how the country code is typed.
  const key = normPhone(phone).slice(-9);
  if (key.length < 9) return null;
  return store.users.find((u) => u.phone.slice(-9) === key) ?? null;
}

export function getUserById(id: string): UserAccount | null {
  load();
  return store.users.find((u) => u.id === id) ?? null;
}

export function getUserByTelegramId(telegramId: string | number): UserAccount | null {
  load();
  const tid = String(telegramId);
  return store.users.find((u) => u.telegramId === tid) ?? null;
}

export function createUserAccount(input: {
  name: string;
  phone: string;
  passwordHash: string;
  telegramId?: string;
}): UserAccount {
  load();
  const user: UserAccount = {
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    phone: normPhone(input.phone),
    name: input.name,
    passwordHash: input.passwordHash,
    telegramId: input.telegramId,
    createdAt: Date.now(),
  };
  store.users.push(user);
  atomicWrite(USERS_FILE, store.users);
  return user;
}

export function updateUser(id: string, patch: Partial<UserAccount>): UserAccount | null {
  load();
  const u = store.users.find((x) => x.id === id);
  if (!u) return null;
  Object.assign(u, patch);
  if (patch.phone) u.phone = normPhone(patch.phone);
  atomicWrite(USERS_FILE, store.users);
  return u;
}
