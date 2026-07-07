'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Navigation, Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCheckoutState } from '../useCheckoutState';
import { useSiteSettings } from '@/lib/stores/siteSettings';

interface DirItem {
  code: string;
  name: string;
  address?: string;
  lat_long?: string;
  phone?: string;
}

function parseLatLng(s?: string): { lat: number; lng: number } | null {
  if (!s) return null;
  const [a, b] = s.split(',').map(Number);
  return Number.isFinite(a) && Number.isFinite(b) ? { lat: a, lng: b } : null;
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

async function fetchItems(url: string): Promise<DirItem[]> {
  try {
    const r = await fetch(url);
    if (!r.ok) return [];
    const j = await r.json();
    return j?.data?.items || [];
  } catch {
    return [];
  }
}

/**
 * BTS branch (filial) picker: region → city → branch. Writes the chosen branch
 * (and a live delivery-price estimate) into the checkout state. Renders nothing
 * fatal when BTS is unconfigured — the parent hides the option in that case.
 */
export function BtsBranchPicker({ me }: { me: { lat: number; lng: number } | null }) {
  const t = useTranslations('checkout');
  const { delivery, setDelivery } = useCheckoutState();
  const dispatch = useSiteSettings((s) => s.bts?.dispatch);
  const [regions, setRegions] = useState<DirItem[]>([]);
  const [cities, setCities] = useState<DirItem[]>([]);
  const [branches, setBranches] = useState<DirItem[]>([]);
  const [busy, setBusy] = useState<'cities' | 'branches' | null>(null);

  // Load regions once, then restore persisted city/branch lists if present.
  useEffect(() => {
    let alive = true;
    (async () => {
      const rs = await fetchItems('/api/delivery/bts/directory?type=regions');
      if (!alive) return;
      setRegions(rs);
      if (delivery.btsRegionCode) {
        const cs = await fetchItems(`/api/delivery/bts/directory?type=cities&regionCode=${delivery.btsRegionCode}`);
        if (!alive) return;
        setCities(cs);
        if (delivery.btsCityCode) {
          const bs = await fetchItems(
            `/api/delivery/bts/directory?type=branches&regionCode=${delivery.btsRegionCode}&cityCode=${delivery.btsCityCode}`,
          );
          if (alive) setBranches(bs);
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRegion = async (code: string) => {
    const name = regions.find((r) => r.code === code)?.name || '';
    setDelivery({
      btsRegionCode: code || undefined,
      btsRegionName: name || undefined,
      btsCityCode: undefined,
      btsCityName: undefined,
      btsBranchCode: undefined,
      btsBranchName: undefined,
      btsBranchAddress: undefined,
      btsPrice: undefined,
    });
    setCities([]);
    setBranches([]);
    if (!code) return;
    setBusy('cities');
    setCities(await fetchItems(`/api/delivery/bts/directory?type=cities&regionCode=${code}`));
    setBusy(null);
  };

  const onCity = async (code: string) => {
    const name = cities.find((c) => c.code === code)?.name || '';
    setDelivery({
      btsCityCode: code || undefined,
      btsCityName: name || undefined,
      btsBranchCode: undefined,
      btsBranchName: undefined,
      btsBranchAddress: undefined,
      btsPrice: undefined,
    });
    setBranches([]);
    if (!code || !delivery.btsRegionCode) return;
    setBusy('branches');
    setBranches(
      await fetchItems(`/api/delivery/bts/directory?type=branches&regionCode=${delivery.btsRegionCode}&cityCode=${code}`),
    );
    setBusy(null);
  };

  const onBranch = async (b: DirItem) => {
    setDelivery({ btsBranchCode: b.code, btsBranchName: b.name, btsBranchAddress: b.address, btsPrice: undefined });
    // Live delivery-cost estimate for this destination city (branch pickup).
    try {
      const r = await fetch('/api/delivery/bts/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverCityCode: delivery.btsCityCode, dropoff_type: 'branch' }),
      });
      const j = await r.json();
      // Match the shop's dispatch mode: courier pickup → courier_to_branch,
      // otherwise the shop drops parcels at a branch → branch_to_branch.
      const cell = dispatch === 'courier' ? j?.data?.courier_to_branch : j?.data?.branch_to_branch;
      const price = cell?.price ?? j?.data?.branch_to_branch?.price ?? j?.data?.courier_to_branch?.price;
      if (typeof price === 'number') setDelivery({ btsPrice: price });
    } catch {
      /* estimate is best-effort */
    }
  };

  const sortedBranches = useMemo(() => {
    if (!me) return branches;
    return [...branches].sort((x, y) => {
      const lx = parseLatLng(x.lat_long);
      const ly = parseLatLng(y.lat_long);
      return (lx ? distanceKm(me, lx) : 1e9) - (ly ? distanceKm(me, ly) : 1e9);
    });
  }, [branches, me]);

  const selectCls =
    'w-full rounded-xl border-2 border-brand-surface-border bg-brand-surface px-3 py-3 text-sm font-semibold text-white outline-none focus:border-brand-yellow/60 disabled:opacity-40';

  return (
    <div className="space-y-3 animate-slide-up">
      {/* Region */}
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-white/45">
          {t('btsRegionLabel')}
        </label>
        <select className={selectCls} value={delivery.btsRegionCode || ''} onChange={(e) => onRegion(e.target.value)}>
          <option value="">{t('btsRegionPlaceholder')}</option>
          {regions.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-white/45">
          {t('btsCityLabel')}
        </label>
        <select
          className={selectCls}
          value={delivery.btsCityCode || ''}
          disabled={!delivery.btsRegionCode || busy === 'cities'}
          onChange={(e) => onCity(e.target.value)}
        >
          <option value="">{busy === 'cities' ? t('btsLoading') : t('btsCityPlaceholder')}</option>
          {cities.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Branches */}
      {delivery.btsCityCode && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/45">{t('btsChooseBranch')}</h3>
          {busy === 'branches' && (
            <p className="flex items-center gap-2 px-1 py-2 text-xs text-white/45">
              <Loader2 className="h-4 w-4 animate-spin text-brand-yellow" />
              {t('btsLoading')}
            </p>
          )}
          {busy !== 'branches' && sortedBranches.length === 0 && (
            <p className="rounded-xl border border-dashed border-brand-surface-border px-3 py-3 text-xs text-white/45">
              {t('btsNoBranches')}
            </p>
          )}
          {sortedBranches.map((b) => {
            const active = delivery.btsBranchCode === b.code;
            const loc = parseLatLng(b.lat_long);
            const dist = me && loc ? distanceKm(me, loc) : null;
            return (
              <button
                key={b.code}
                type="button"
                onClick={() => onBranch(b)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors touch-feedback',
                  active ? 'border-brand-yellow bg-brand-yellow/8' : 'border-brand-surface-border bg-brand-surface',
                )}
              >
                <div
                  className={cn(
                    'mt-1 h-4 w-4 shrink-0 rounded-full border-2 transition-colors',
                    active ? 'border-brand-yellow bg-brand-yellow' : 'border-brand-surface-border',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold">{b.name}</p>
                    {dist != null && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-brand-dark/60 px-1.5 py-0.5 text-[10px] font-bold text-brand-yellow">
                        <Navigation className="h-3 w-3" />
                        {dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}
                      </span>
                    )}
                  </div>
                  {b.address && (
                    <p className="mt-0.5 flex items-start gap-1 text-xs text-white/55">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-brand-yellow" />
                      <span className="line-clamp-2">{b.address}</span>
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
