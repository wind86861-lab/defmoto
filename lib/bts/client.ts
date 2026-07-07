/**
 * BTS (bts.uz) delivery/courier API client.
 * Docs: https://docs.bts.uz
 *
 * BTS is a logistics/courier + fulfillment service (not a payment gateway).
 * It supports cash-on-delivery (back_money) so it doubles as the "pay the
 * courier on delivery" flow. This client manages auth (access/refresh tokens),
 * and wraps: cost calculation, shipment creation, reference directories
 * (regions/cities/branches) and webhook registration.
 *
 * Auth endpoints live at {base}/auth/*, everything else at {base}/v1/*.
 * All responses are shaped: { status, message, status_code, data }.
 *
 * Inert until BTS_LOGIN + BTS_PASSWORD are set (btsConfigured() === false).
 */

const BASE_URL = (process.env.BTS_BASE_URL || 'https://apitest.bts.uz:28345').replace(/\/$/, '');
const LOGIN = process.env.BTS_LOGIN || '';
const PASSWORD = process.env.BTS_PASSWORD || '';

// Access token is valid ~24h; refresh a few minutes early.
const ACCESS_TTL_MS = 23 * 60 * 60 * 1000;

interface TokenState {
  accessToken: string;
  refreshToken: string;
  accessExp: number; // epoch ms when we consider the access token stale
}

const globalRef = globalThis as unknown as { __deftBtsAuth?: TokenState | null };

export function btsConfigured(): boolean {
  return Boolean(LOGIN && PASSWORD);
}

export interface BtsEnvelope<T = unknown> {
  status: boolean;
  message: string;
  status_code: number;
  data?: T;
  errors?: Record<string, string[]>;
}

function commonHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    language: process.env.BTS_LANGUAGE || 'uz',
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function rawPost<T>(path: string, body: unknown, token?: string): Promise<BtsEnvelope<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: commonHeaders(token),
    body: JSON.stringify(body),
    // BTS test host uses a non-standard port; give it room.
    cache: 'no-store',
  });
  return (await res.json()) as BtsEnvelope<T>;
}

async function login(): Promise<TokenState> {
  const r = await rawPost<{ access_token: string; refresh_token: string }>(
    '/auth/login',
    { login: LOGIN, password: PASSWORD },
  );
  if (!r.status || !r.data?.access_token) {
    throw new Error(`BTS login failed: ${r.message || 'unknown'}`);
  }
  const state: TokenState = {
    accessToken: r.data.access_token,
    refreshToken: r.data.refresh_token,
    accessExp: Date.now() + ACCESS_TTL_MS,
  };
  globalRef.__deftBtsAuth = state;
  return state;
}

async function refresh(current: TokenState): Promise<TokenState> {
  const r = await rawPost<{ access_token: string; refresh_token: string }>(
    '/auth/refresh',
    { refresh_token: current.refreshToken },
    current.accessToken,
  );
  if (!r.status || !r.data?.access_token) {
    // Refresh token likely expired — fall back to a fresh login.
    return login();
  }
  const state: TokenState = {
    accessToken: r.data.access_token,
    refreshToken: r.data.refresh_token || current.refreshToken,
    accessExp: Date.now() + ACCESS_TTL_MS,
  };
  globalRef.__deftBtsAuth = state;
  return state;
}

async function ensureToken(): Promise<string> {
  if (!btsConfigured()) throw new Error('BTS is not configured');
  let state = globalRef.__deftBtsAuth ?? null;
  if (!state) state = await login();
  else if (Date.now() >= state.accessExp) state = await refresh(state);
  return state.accessToken;
}

/** Authenticated request with a single 401 refresh-and-retry. */
async function api<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<BtsEnvelope<T>> {
  let token = await ensureToken();
  const doFetch = async (t: string) =>
    fetch(`${BASE_URL}${path}`, {
      method,
      headers: commonHeaders(t),
      body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
      cache: 'no-store',
    });

  let res = await doFetch(token);
  if (res.status === 401 && globalRef.__deftBtsAuth) {
    const state = await refresh(globalRef.__deftBtsAuth);
    token = state.accessToken;
    res = await doFetch(token);
  }
  return (await res.json()) as BtsEnvelope<T>;
}

/* ------------------------------- endpoints ------------------------------- */

export type BtsPickupType = 'self' | 'courier';
export type BtsDropoffType = 'courier' | 'branch';

export interface BtsCalculateInput {
  senderCityCode: string;
  receiverCityCode: string;
  // Both are REQUIRED by BTS (422 otherwise). Default to courier→courier so a
  // caller that only cares about the multi-cost matrix still gets all combos.
  pickup_type?: BtsPickupType;
  dropoff_type?: BtsDropoffType;
  weight: number;
  volume?: { x: number; y: number; z: number };
  is_multiple_cost?: 0 | 1;
}

export interface BtsPriceCell {
  available: boolean;
  price: number;
  reason?: string | null;
}
export interface BtsCalculateData {
  branch_to_branch?: BtsPriceCell;
  branch_to_courier?: BtsPriceCell;
  courier_to_branch?: BtsPriceCell;
  courier_to_courier?: BtsPriceCell;
}

export function btsCalculate(input: BtsCalculateInput) {
  // Defaults come AFTER the spread so an explicit `undefined` from the caller
  // can't clobber a required field (BTS 422s without pickup_type/dropoff_type).
  return api<BtsCalculateData>('POST', '/v1/order-calculate/index', {
    ...input,
    is_multiple_cost: input.is_multiple_cost ?? 1,
    pickup_type: input.pickup_type ?? 'courier',
    dropoff_type: input.dropoff_type ?? 'courier',
  });
}

export interface BtsParty {
  name: string;
  phone: string;
  phone1?: string;
  address: string;
  city_code?: string;
  branch_code?: string;
  latitude?: number | string;
  longitude?: number | string;
}

export interface BtsCreateOrderInput {
  clientId: string;
  pickup_type: BtsPickupType;
  dropoff_type: BtsDropoffType;
  is_sender_location?: boolean;
  is_receiver_location?: boolean;
  sender: BtsParty;
  receiver: BtsParty;
  bringBackMoney?: 0 | 1;
  back_money?: number;
  takePhoto?: 0 | 1;
  bringBackWaybill?: 0 | 1;
  ready_to_take?: boolean;
  cargo: {
    weight: number;
    volume?: number;
    piece: number;
    packageId?: number;
    postTypeId?: number;
    postTypes?: { name: string; code: string; count: number; cost: number }[];
  };
}

export interface BtsCreateOrderData {
  orderId: number;
  clientId: string;
  barcode: string;
  cost: number;
  tracking?: string;
  status?: { code: number | null; info?: string };
}

export function btsCreateOrder(input: BtsCreateOrderInput) {
  return api<BtsCreateOrderData>('POST', '/v1/order/add', input);
}

export interface BtsDirectoryItem {
  code: string;
  name: string;
  // Present on branch items (directory/branches) only.
  regionCode?: string;
  cityCode?: string;
  address?: string;
  lat_long?: string; // "latitude,longitude"
  phone?: string;
  working_hours?: Record<string, string | null>;
}
interface BtsDirectoryData {
  items: BtsDirectoryItem[];
}

export function btsRegions() {
  return api<BtsDirectoryData>('GET', '/v1/directory/regions');
}
export function btsCities(regionCode: string) {
  return api<BtsDirectoryData>('GET', `/v1/directory/cities?regionCode=${encodeURIComponent(regionCode)}`);
}
// BTS requires BOTH regionCode and cityCode to list branches.
export function btsBranches(regionCode: string, cityCode: string) {
  const qs = new URLSearchParams({ regionCode, cityCode }).toString();
  return api<BtsDirectoryData>('GET', `/v1/directory/branches?${qs}`);
}

/** Register (or update) the status webhook URL with BTS. */
export function btsRegisterWebhook(webhookUrl: string) {
  return api('POST', '/v1/webhook/webhook-config', {
    webhook_url: webhookUrl,
    environment: process.env.BTS_ENVIRONMENT || 'test',
    has_token: Boolean(process.env.BTS_WEBHOOK_KEY),
    'itx-apiKey': process.env.BTS_WEBHOOK_KEY || undefined,
  });
}

/* --------------------------- status code mapping -------------------------- */

/** Map a BTS numeric status code to our internal order status. */
export function btsStatusToOrderStatus(code: number): string {
  switch (code) {
    case 1200:
      return 'delivered';
    case 1300:
      return 'cancelled';
    case 1400:
      return 'expired';
    case 100:
      return 'confirmed';
    default:
      // 200..1100 → in transit
      return 'shipping';
  }
}
