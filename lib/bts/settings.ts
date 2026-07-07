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
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  pickupType: BtsPickupType; // 'self' = drop at BTS branch, 'courier' = BTS collects
}

interface PersistedBts {
  enabled?: boolean;
  cityCode?: string;
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  dispatch?: 'self' | 'courier';
}

export function getBtsSender(): BtsSender {
  const blob = getContent<{ state?: { bts?: PersistedBts } } | null>('site-settings', null);
  const s = blob?.state?.bts || {};
  return {
    enabled: s.enabled !== false,
    senderCityCode: s.cityCode || process.env.BTS_SENDER_CITY_CODE || undefined,
    senderName: s.senderName || process.env.BTS_SENDER_NAME || 'DEFT MOTO',
    senderPhone: s.senderPhone || process.env.BTS_SENDER_PHONE || '',
    senderAddress: s.senderAddress || process.env.BTS_SENDER_ADDRESS || '',
    pickupType: (s.dispatch as BtsPickupType) || (process.env.BTS_PICKUP_TYPE as BtsPickupType) || 'self',
  };
}
