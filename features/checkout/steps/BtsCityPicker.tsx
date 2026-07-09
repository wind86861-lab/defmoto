'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCheckoutState } from '../useCheckoutState';
import { useSiteSettings } from '@/lib/stores/siteSettings';

interface DirItem {
  code: string;
  name: string;
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
 * BTS region → city selector for courier-to-door delivery. Captures the
 * receiver city CODE (BTS can't price a free-text city) and computes the
 * courier delivery price. Writes into the checkout `delivery` + `address`.
 */
export function BtsCityPicker() {
  const t = useTranslations('checkout');
  const { delivery, setDelivery, setAddress } = useCheckoutState();
  const dispatch = useSiteSettings((s) => s.bts?.dispatch);
  const [regions, setRegions] = useState<DirItem[]>([]);
  const [cities, setCities] = useState<DirItem[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const rs = await fetchItems('/api/delivery/bts/directory?type=regions');
      if (!alive) return;
      setRegions(rs);
      if (delivery.btsRegionCode) {
        setCities(await fetchItems(`/api/delivery/bts/directory?type=cities&regionCode=${delivery.btsRegionCode}`));
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
      btsPrice: undefined,
    });
    setCities([]);
    if (!code) return;
    setBusy(true);
    setCities(await fetchItems(`/api/delivery/bts/directory?type=cities&regionCode=${code}`));
    setBusy(false);
  };

  const onCity = async (code: string) => {
    const name = cities.find((c) => c.code === code)?.name || '';
    setDelivery({ btsCityCode: code || undefined, btsCityName: name || undefined, btsPrice: undefined });
    // Keep the address.city in sync for the order summary.
    if (name) setAddress({ city: name });
    if (!code) return;
    // Live courier-to-door price estimate.
    try {
      const r = await fetch('/api/delivery/bts/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverCityCode: code, dropoff_type: 'courier' }),
      });
      const j = await r.json();
      const cell = dispatch === 'courier' ? j?.data?.courier_to_courier : j?.data?.branch_to_courier;
      const price = cell?.price ?? j?.data?.courier_to_courier?.price ?? j?.data?.branch_to_courier?.price;
      if (typeof price === 'number') setDelivery({ btsPrice: price });
    } catch {
      /* estimate is best-effort */
    }
  };

  const selectCls =
    'w-full rounded-xl border-2 border-brand-surface-border bg-brand-surface px-3 py-3 text-sm font-semibold text-white outline-none focus:border-brand-yellow/60 disabled:opacity-40';

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/45">
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
      <div>
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/45">
          {t('btsCityLabel')}
        </label>
        <select
          className={selectCls}
          value={delivery.btsCityCode || ''}
          disabled={!delivery.btsRegionCode || busy}
          onChange={(e) => onCity(e.target.value)}
        >
          <option value="">{busy ? t('btsLoading') : t('btsCityPlaceholder')}</option>
          {cities.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
