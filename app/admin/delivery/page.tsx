'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Truck, Check, AlertTriangle, Building2, Bike, Calculator, Package } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/Input';
import { formatPrice, formatDateTime } from '@/lib/format';
import { useSiteSettings } from '@/lib/stores/siteSettings';
import { useMounted } from '@/hooks/useMounted';
import { useHaptic } from '@/hooks/useHaptic';

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

/* ------------------------- BTS shipments section ------------------------- */

interface BtsOrder {
  id: string;
  number: string;
  status: string;
  customerName?: string;
  phone?: string;
  total: number;
  createdAt: number;
  payload?: {
    contact?: { name?: string; phone?: string };
    items?: Array<{ productId: string; name?: string; weight?: number; quantity?: number }>;
    delivery?: { method?: string; bts?: { branchName?: string; cityName?: string } };
  };
  bts?: { barcode?: string; tracking?: string; cost?: number };
}

function BtsShipmentsSection() {
  const [orders, setOrders] = useState<BtsOrder[]>([]);
  const [tab, setTab] = useState<'pending' | 'shipped'>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch('/api/orders', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const all: BtsOrder[] = d?.orders || [];
        setOrders(
          all.filter((o) => {
            const m = o.payload?.delivery?.method;
            return m === 'bts' || m === 'post';
          }),
        );
      })
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  const pending = orders.filter((o) => !o.bts?.barcode && o.status !== 'cancelled');
  const shipped = orders.filter((o) => !!o.bts?.barcode);
  const list = tab === 'pending' ? pending : shipped;

  // Inline create — only when every item already has a weight; otherwise the
  // order page asks for the missing weights.
  const createShipment = async (o: BtsOrder) => {
    setErr(null);
    setBusyId(o.id);
    try {
      const res = await fetch('/api/delivery/bts/shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: o.id }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) load();
      else setErr(`${o.number}: ${data?.error || 'BTS xatosi'}`);
    } catch {
      setErr(`${o.number}: tarmoq xatosi`);
    } finally {
      setBusyId(null);
    }
  };

  const rowName = (o: BtsOrder) => o.customerName || o.payload?.contact?.name || 'Mijoz';

  return (
    <section className="space-y-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/45">
          <Package className="h-4 w-4 text-brand-yellow" /> BTS joʻnatmalar
        </h2>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setTab('pending')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors',
              tab === 'pending' ? 'bg-brand-yellow/15 text-brand-yellow' : 'text-white/50 hover:text-white',
            )}
          >
            ⏳ Yaratilmagan ({pending.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('shipped')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors',
              tab === 'shipped' ? 'bg-success/15 text-success' : 'text-white/50 hover:text-white',
            )}
          >
            ✅ Yaratilgan ({shipped.length})
          </button>
        </div>
      </div>

      {err && <p className="text-xs text-danger">⚠️ {err}</p>}

      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-brand-surface-border px-3 py-5 text-center text-xs text-white/45">
          {tab === 'pending' ? 'Yaratilmagan joʻnatma yoʻq 🎉' : 'Hali joʻnatma yaratilmagan.'}
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((o) => {
            const missingW = (o.payload?.items || []).some((it) => !(Number(it.weight) > 0));
            const dest = o.payload?.delivery?.bts;
            return (
              <div
                key={o.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-brand-surface-border bg-brand-dark/40 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/orders/${o.id}`} className="font-display text-sm font-bold text-white hover:text-brand-yellow">
                    #{o.number}
                  </Link>
                  <p className="truncate text-[11px] text-white/50">
                    {rowName(o)} · {o.phone || o.payload?.contact?.phone || ''} ·{' '}
                    {formatDateTime(new Date(o.createdAt).toISOString())}
                  </p>
                  {dest?.branchName && (
                    <p className="truncate text-[11px] text-white/40">
                      📍 {[dest.cityName, dest.branchName].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-display text-sm font-extrabold text-brand-yellow">
                  {formatPrice(o.total)}
                </span>
                {o.bts?.barcode ? (
                  <span className="inline-flex shrink-0 items-center gap-2 text-[11px] font-bold">
                    <span className="rounded-md bg-success/15 px-1.5 py-0.5 font-mono text-success">{o.bts.barcode}</span>
                    {o.bts.tracking && (
                      <a href={o.bts.tracking} target="_blank" rel="noopener noreferrer" className="text-brand-yellow hover:underline">
                        🔍 Kuzatish
                      </a>
                    )}
                  </span>
                ) : missingW ? (
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="shrink-0 rounded-lg border border-brand-yellow/40 bg-brand-yellow/10 px-2.5 py-1.5 text-[11px] font-bold text-brand-yellow hover:bg-brand-yellow/20"
                  >
                    ⚖️ Vazn kerak — ochish
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => createShipment(o)}
                    disabled={busyId === o.id}
                    className="shrink-0 rounded-lg bg-gradient-yellow px-2.5 py-1.5 text-[11px] font-bold text-brand-dark shadow-glow-sm hover:brightness-110 disabled:opacity-50"
                  >
                    {busyId === o.id ? '…' : '🚚 Yaratish'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function AdminDeliveryPage() {
  const mounted = useMounted();
  const { notify } = useHaptic();
  const bts = useSiteSettings((s) => s.bts);
  const setBts = useSiteSettings((s) => s.setBts);

  const [regions, setRegions] = useState<DirItem[]>([]);
  const [cities, setCities] = useState<DirItem[]>([]);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ branch: number; courier: number } | null>(null);
  const [tab, setTab] = useState<'shipments' | 'settings'>('shipments');

  const flash = () => {
    setSavedAt(new Date().toLocaleTimeString('en-GB'));
    setTimeout(() => setSavedAt(null), 2000);
  };
  const patch = (p: Parameters<typeof setBts>[0]) => {
    setBts(p);
    flash();
  };

  // Load regions (and detect whether BTS creds are configured server-side).
  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await fetch('/api/delivery/bts/directory?type=regions');
      if (!alive) return;
      if (!r.ok) {
        setAvailable(false);
        return;
      }
      setAvailable(true);
      const j = await r.json();
      setRegions(j?.data?.items || []);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Restore the city list for the persisted region.
  useEffect(() => {
    if (!bts?.regionCode) return;
    fetchItems(`/api/delivery/bts/directory?type=cities&regionCode=${bts.regionCode}`).then(setCities);
  }, [bts?.regionCode]);

  const onRegion = async (code: string) => {
    const name = regions.find((r) => r.code === code)?.name || '';
    patch({ regionCode: code || undefined, regionName: name || undefined, cityCode: undefined, cityName: undefined });
    setCities([]);
    setPreview(null);
    if (code) setCities(await fetchItems(`/api/delivery/bts/directory?type=cities&regionCode=${code}`));
  };

  const onCity = (code: string) => {
    const name = cities.find((c) => c.code === code)?.name || '';
    patch({ cityCode: code || undefined, cityName: name || undefined });
    setPreview(null);
  };

  // Sample price from the origin to a couple of far cities, so the admin can
  // sanity-check their setup (Jizzax / Arnasoy 2502 as a reference destination).
  const runPreview = async () => {
    if (!bts?.cityCode) return;
    notify('success');
    try {
      const r = await fetch('/api/delivery/bts/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderCityCode: bts.cityCode, receiverCityCode: '2502' }),
      });
      const j = await r.json();
      const branch = j?.data?.branch_to_branch?.price;
      const courier = j?.data?.courier_to_branch?.price;
      if (typeof branch === 'number') setPreview({ branch, courier: courier ?? 0 });
    } catch {
      /* ignore */
    }
  };

  const inputCls = 'w-full';
  const selectCls =
    'w-full rounded-xl border-2 border-brand-surface-border bg-brand-surface px-3 py-3 text-sm font-semibold text-white outline-none focus:border-brand-yellow/60 disabled:opacity-40';

  const dispatchOptions = useMemo(
    () =>
      [
        { key: 'self' as const, icon: Building2, title: "O'zim filialga eltaman", desc: 'Arzonroq (branch → branch)' },
        { key: 'courier' as const, icon: Bike, title: 'BTS kuryeri oladi', desc: "Do'kondan olib ketadi (courier → branch)" },
      ],
    [],
  );

  if (!mounted) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-display-sm font-extrabold sm:text-display-md">
            <Truck className="h-6 w-6 text-brand-yellow" />
            BTS yetkazish
          </h1>
          <p className="mt-1 text-sm text-white/55">
            Jo'natuvchi (do'kon) sozlamalari — narx shu shahar → mijoz filiali bo'yicha hisoblanadi.
          </p>
        </div>
        {savedAt && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-success/15 px-2.5 py-1 text-xs font-bold text-success">
            <Check className="h-3.5 w-3.5" /> Saqlandi
          </span>
        )}
      </header>

      {available === false && (
        <div className="flex items-start gap-3 rounded-xl border border-danger/40 bg-danger/8 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div>
            <p className="font-bold text-danger">BTS kalitlari serverda sozlanmagan</p>
            <p className="mt-0.5 text-white/60">
              Serverdagi <code>.env</code> ga BTS_LOGIN / BTS_PASSWORD qo'yilgach, bu sahifa ishlaydi.
            </p>
          </div>
        </div>
      )}

      {/* Tabs: shipments (daily work) / settings (rare) */}
      <div className="flex gap-1.5 rounded-2xl border border-brand-surface-border bg-brand-surface p-1.5">
        <button
          type="button"
          onClick={() => setTab('shipments')}
          className={cn(
            'flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors',
            tab === 'shipments' ? 'bg-gradient-yellow text-brand-dark shadow-glow-sm' : 'text-white/60 hover:text-white',
          )}
        >
          📦 Joʻnatmalar
        </button>
        <button
          type="button"
          onClick={() => setTab('settings')}
          className={cn(
            'flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors',
            tab === 'settings' ? 'bg-gradient-yellow text-brand-dark shadow-glow-sm' : 'text-white/60 hover:text-white',
          )}
        >
          ⚙️ Sozlamalar
        </button>
      </div>

      {tab === 'shipments' && <BtsShipmentsSection />}

      {tab === 'settings' && (
        <>
      {/* Enable toggle */}
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
        <div>
          <p className="font-display text-base font-bold">BTS filial yetkazish yoqilgan</p>
          <p className="mt-0.5 text-xs text-white/55">O'chirilsa, checkout'da BTS usuli ko'rinmaydi.</p>
        </div>
        <input
          type="checkbox"
          checked={bts?.enabled !== false}
          onChange={(e) => patch({ enabled: e.target.checked })}
          className="h-6 w-6 accent-brand-yellow"
        />
      </label>

      {/* Origin */}
      <section className="space-y-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-white/45">Jo'natuvchi manzil (origin)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/45">Viloyat</label>
            <select className={selectCls} value={bts?.regionCode || ''} onChange={(e) => onRegion(e.target.value)}>
              <option value="">Viloyatni tanlang</option>
              {regions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/45">Shahar / tuman</label>
            <select
              className={selectCls}
              value={bts?.cityCode || ''}
              disabled={!bts?.regionCode}
              onChange={(e) => onCity(e.target.value)}
            >
              <option value="">Shahar / tuman tanlang</option>
              {cities.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price preview */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={runPreview}
            disabled={!bts?.cityCode}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-surface-border px-3 py-1.5 text-xs font-semibold text-white/70 hover:border-brand-yellow/40 hover:text-brand-yellow disabled:opacity-40"
          >
            <Calculator className="h-3.5 w-3.5 text-brand-yellow" /> Narxni tekshirish (→ Jizzax)
          </button>
          {preview && (
            <span className="text-xs text-white/60">
              branch→branch:{' '}
              <b className="text-brand-yellow">{preview.branch.toLocaleString('ru-RU')}</b> so'm · courier→branch:{' '}
              <b className="text-white/80">{preview.courier.toLocaleString('ru-RU')}</b> so'm
            </span>
          )}
        </div>
      </section>

      {/* Sender contact */}
      <section className="space-y-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-white/45">Jo'natuvchi ma'lumotlari (yuk xati uchun)</h2>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/45">Nomi</label>
          <Input
            className={inputCls}
            value={bts?.senderName || ''}
            onChange={(e) => setBts({ senderName: e.target.value })}
            onBlur={flash}
            placeholder="DEFT MOTO"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/45">Telefon</label>
          <Input
            className={inputCls}
            value={bts?.senderPhone || ''}
            onChange={(e) => setBts({ senderPhone: e.target.value })}
            onBlur={flash}
            placeholder="998901234567"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/45">Manzil</label>
          <Input
            className={inputCls}
            value={bts?.senderAddress || ''}
            onChange={(e) => setBts({ senderAddress: e.target.value })}
            onBlur={flash}
            placeholder="Toshkent, ... ko'chasi, uy"
          />
        </div>
      </section>

      {/* Dispatch mode */}
      <section className="space-y-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-white/45">BTS'ga qanday topshiriladi</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {dispatchOptions.map((o) => {
            const active = (bts?.dispatch || 'self') === o.key;
            const Icon = o.icon;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => patch({ dispatch: o.key })}
                className={cn(
                  'flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all',
                  active
                    ? 'border-brand-yellow bg-brand-yellow/8 shadow-glow-sm'
                    : 'border-brand-surface-border hover:border-brand-yellow/40',
                )}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    active ? 'bg-gradient-yellow text-brand-dark' : 'bg-brand-surface-elevated text-white/70',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold">{o.title}</p>
                  <p className="mt-0.5 text-[11px] text-white/55">{o.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
        </>
      )}
    </div>
  );
}
