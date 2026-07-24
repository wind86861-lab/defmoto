'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/Select';
import { useCheckoutState } from '../useCheckoutState';
import { useSiteSettings } from '@/lib/stores/siteSettings';
import { useCartStore } from '@/lib/stores/cart';
import { cartWeightKg } from '@/lib/cartWeight';

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
  const weight = useCartStore((s) => cartWeightKg(s.items));
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
        body: JSON.stringify({ receiverCityCode: code, dropoff_type: 'courier', weight, originId: delivery.btsOriginId }),
      });
      const j = await r.json();
      const cell = dispatch === 'courier' ? j?.data?.courier_to_courier : j?.data?.branch_to_courier;
      const price = cell?.price ?? j?.data?.courier_to_courier?.price ?? j?.data?.branch_to_courier?.price;
      if (typeof price === 'number') setDelivery({ btsPrice: price });
    } catch {
      /* estimate is best-effort */
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/45">
          {t('btsRegionLabel')}
        </label>
        <Select
          value={delivery.btsRegionCode || ''}
          onChange={onRegion}
          placeholder={t('btsRegionPlaceholder')}
          options={regions.map((r) => ({ value: r.code, label: r.name }))}
        />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/45">
          {t('btsCityLabel')}
        </label>
        <Select
          value={delivery.btsCityCode || ''}
          onChange={onCity}
          disabled={!delivery.btsRegionCode || busy}
          placeholder={busy ? t('btsLoading') : t('btsCityPlaceholder')}
          options={cities.map((c) => ({ value: c.code, label: c.name }))}
        />
      </div>
    </div>
  );
}
