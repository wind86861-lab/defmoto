/**
 * Server-side view of the admin-managed BTS sender (shop origin) settings.
 *
 * The admin panel persists these into the `site-settings` content blob (via
 * the zustand server-persist storage: `{ state, version }`). This reads that
 * blob and falls back to env vars, so the shop can configure BTS entirely from
 * the admin page without touching the server.
 */

import { getContent } from '@/lib/db';
import type { BtsPickupType } from './client';

export interface BtsSender {
  enabled: boolean;
  senderCityCode?: string;
  senderBranchCode?: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  pickupType: BtsPickupType; // 'self' = drop at BTS branch, 'courier' = BTS collects
}

interface PersistedOrigin {
  id: string;
  name?: string;
  cityCode?: string;
  branchCode?: string;
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  active?: boolean;
}

interface PersistedBts {
  enabled?: boolean;
  cityCode?: string;
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  dispatch?: 'self' | 'courier';
  origins?: PersistedOrigin[];
  defaultOriginId?: string;
  customerPicksOrigin?: boolean;
}

/**
 * Resolve the shop sender. With `originId` (customer-picked origin point) the
 * matching ACTIVE origin wins; otherwise the default active origin; otherwise
 * the legacy single-origin fields; env vars are the last fallback.
 */
export function getBtsSender(originId?: string): BtsSender {
  const blob = getContent<{ state?: { bts?: PersistedBts } } | null>('site-settings', null);
  const s = blob?.state?.bts || {};
  const actives = (s.origins || []).filter((o) => o.active !== false);
  const origin =
    (originId ? actives.find((o) => o.id === originId) : undefined) ||
    actives.find((o) => o.id === s.defaultOriginId) ||
    actives[0];
  return {
    enabled: s.enabled !== false,
    senderCityCode:
      origin?.cityCode || s.cityCode || process.env.BTS_SENDER_CITY_CODE || undefined,
    senderBranchCode: origin?.branchCode || process.env.BTS_SENDER_BRANCH_CODE || undefined,
    senderName: origin?.senderName || s.senderName || process.env.BTS_SENDER_NAME || 'DEFT MOTO',
    senderPhone: origin?.senderPhone || s.senderPhone || process.env.BTS_SENDER_PHONE || '',
    senderAddress:
      origin?.senderAddress || s.senderAddress || process.env.BTS_SENDER_ADDRESS || '',
    pickupType: (s.dispatch as BtsPickupType) || (process.env.BTS_PICKUP_TYPE as BtsPickupType) || 'self',
  };
}
