'use client';

import { useEffect, useMemo, useState } from 'react';
import { Store, MapPin, Navigation, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { useCheckoutState } from '../useCheckoutState';
import { useContentStore } from '@/lib/stores/content';
import { useSiteSettings } from '@/lib/stores/siteSettings';
import { useMounted } from '@/hooks/useMounted';
import { mapsHref, branchLatLng, osmEmbed } from '@/lib/contactLinks';
import { BtsBranchPicker } from './BtsBranchPicker';
import type { DeliveryMethod } from '@/types/order';

function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function DeliveryStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const t = useTranslations('checkout');
  const { delivery, setDelivery } = useCheckoutState();
  const mounted = useMounted();
  const storeBranches = useContentStore((s) => s.branches);
  const branches = mounted ? storeBranches : [];
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [btsConfigured, setBtsConfigured] = useState(false);
  const btsEnabled = useSiteSettings((s) => s.bts?.enabled !== false);
  const btsAvailable = btsConfigured && btsEnabled;

  // Ask for the user's location once (to show distance to each branch).
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setMe({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  }, []);

  // Offer BTS branch pickup only when BTS is actually wired up (creds set).
  useEffect(() => {
    let alive = true;
    fetch('/api/delivery/bts/directory?type=regions')
      .then((r) => {
        if (alive && r.ok) setBtsConfigured(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const options: {
    method: DeliveryMethod;
    title: string;
    desc: string;
    icon: typeof Store;
    price: string;
    duration: string;
  }[] = [
    {
      method: 'pickup',
      title: t('pickupTitle'),
      desc: t('pickupDesc'),
      icon: Store,
      price: t('pickupPrice'),
      duration: t('pickupDuration'),
    },
    ...(btsAvailable
      ? [
          {
            method: 'bts' as DeliveryMethod,
            title: t('btsBranchTitle'),
            desc: t('btsBranchDesc'),
            icon: Building2,
            price: t('btsBranchPrice'),
            duration: t('btsBranchDuration'),
          },
        ]
      : []),
  ];

  // Branches with resolved coordinates + computed distance, nearest first.
  const branchList = useMemo(() => {
    return branches
      .map((b) => {
        const loc = branchLatLng(b);
        const dist = me && loc ? distanceKm(me, loc) : null;
        return { b, loc, dist };
      })
      .sort((x, y) => (x.dist ?? 1e9) - (y.dist ?? 1e9));
  }, [branches, me]);

  const selected = branchList.find((x) => x.b.id === delivery.branchId);

  const canContinue =
    delivery.method === 'pickup'
      ? Boolean(delivery.branchId)
      : delivery.method === 'bts'
        ? Boolean(delivery.btsBranchCode)
        : true;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-display-sm font-extrabold">{t('deliveryTitle')}</h2>
        <p className="mt-1 text-sm text-white/55">{t('deliverySubtitle')}</p>
      </header>

      <div className="space-y-2">
        {options.map((opt) => {
          const active = delivery.method === opt.method;
          const Icon = opt.icon;
          return (
            <button
              key={opt.method}
              type="button"
              onClick={() =>
                setDelivery({
                  method: opt.method,
                  branchId: undefined,
                  // Reset BTS selection so filial/courier prices don't carry over.
                  btsBranchCode: undefined,
                  btsBranchName: undefined,
                  btsBranchAddress: undefined,
                  btsPrice: undefined,
                })
              }
              className={cn(
                'flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all touch-feedback',
                active
                  ? 'border-brand-yellow bg-brand-yellow/8 shadow-glow-sm'
                  : 'border-brand-surface-border bg-brand-surface hover:border-brand-yellow/40',
              )}
            >
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors',
                  active ? 'bg-gradient-yellow text-brand-dark' : 'bg-brand-surface-elevated text-white/70',
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold">{opt.title}</h3>
                  <span className="shrink-0 text-sm font-bold text-brand-yellow">{opt.price}</span>
                </div>
                <p className="mt-0.5 text-xs text-white/55">{opt.desc}</p>
                <p className="mt-1 text-[11px] font-semibold text-white/45">{opt.duration}</p>
              </div>
              <div
                className={cn(
                  'h-5 w-5 shrink-0 rounded-full border-2 transition-colors',
                  active
                    ? 'border-brand-yellow bg-brand-yellow shadow-glow-sm ring-2 ring-brand-yellow/30'
                    : 'border-brand-surface-border',
                )}
              />
            </button>
          );
        })}
      </div>

      {delivery.method === 'bts' && <BtsBranchPicker me={me} />}

      {delivery.method === 'pickup' && (
        <div className="space-y-2 animate-slide-up">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/45">{t('chooseBranch')}</h3>
          {branchList.length === 0 && (
            <p className="rounded-xl border border-dashed border-brand-surface-border px-3 py-3 text-xs text-white/45">
              {t('noBranches')}
            </p>
          )}
          {branchList.map(({ b, dist }) => {
            const active = delivery.branchId === b.id;
            const map = mapsHref(b);
            const full = b.address.startsWith(b.city) ? b.address : `${b.city}, ${b.address}`;
            return (
              <div
                key={b.id}
                className={cn(
                  'rounded-xl border p-3 transition-colors',
                  active ? 'border-brand-yellow bg-brand-yellow/8' : 'border-brand-surface-border bg-brand-surface',
                )}
              >
                <button
                  type="button"
                  onClick={() => setDelivery({ branchId: b.id })}
                  className="flex w-full items-start gap-3 text-left touch-feedback"
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
                    <p className="mt-0.5 text-xs text-white/55">{full}</p>
                  </div>
                </button>
                {map && (
                  <a
                    href={map}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-brand-surface-border px-2.5 py-1 text-[11px] font-semibold text-white/70 hover:border-brand-yellow/40 hover:text-brand-yellow"
                  >
                    <MapPin className="h-3.5 w-3.5 text-brand-yellow" />
                    {t('onMap')}
                  </a>
                )}
              </div>
            );
          })}

          {/* OpenStreetMap preview of the chosen branch (no API key needed). */}
          {selected?.loc && (
            <div className="overflow-hidden rounded-xl border border-brand-surface-border">
              <iframe
                key={selected.b.id}
                title={selected.b.name}
                src={osmEmbed(selected.loc.lat, selected.loc.lng)}
                className="h-52 w-full border-0"
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" size="xl" onClick={onBack} className="flex-1">
          {t('back')}
        </Button>
        <Button size="xl" glow onClick={onNext} className="flex-[2]" disabled={!canContinue}>
          {t('continue')}
        </Button>
      </div>
    </div>
  );
}
