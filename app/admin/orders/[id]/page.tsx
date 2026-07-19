'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Phone, Truck, Wallet, Package, Clock } from 'lucide-react';
import { formatPrice, formatDateTime } from '@/lib/format';
import { ProductImage } from '@/components/ui/ProductImage';
import { useContentStore } from '@/lib/stores/content';
import type { Order } from '@/types/order';

interface ServerOrder {
  id: string;
  number: string;
  status: string;
  customerName?: string;
  phone?: string;
  userId?: string;
  total: number;
  createdAt: number;
  payload: Order;
  bts?: { barcode?: string; tracking?: string; cost?: number };
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Kutilmoqda',
  paid: "To'landi",
  confirmed: 'Tasdiqlandi',
  shipping: 'Yetkazilmoqda',
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilindi',
  expired: "Muddati o'tdi",
};

const DELIVERY_LABEL: Record<string, string> = {
  pickup: "Do'kondan olib ketish",
  bts: 'BTS filialidan olish',
  post: 'BTS kuryer (uyga)',
  courier: 'Kuryer',
};

const PAYMENT_LABEL: Record<string, string> = {
  click: 'Click', payme: 'Payme', bts: 'BTS Pay', cash: 'Naqd (yetkazishda)',
};

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [order, setOrder] = useState<ServerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [shipErr, setShipErr] = useState<string | null>(null);
  // productId → entered kg, for order items that have no stored weight.
  const [weightAsk, setWeightAsk] = useState<Record<string, string> | null>(null);
  const updateProduct = useContentStore((s) => s.updateProduct);

  useEffect(() => {
    fetch(`/api/orders/${id}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setOrder(d?.order ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const orderItems = (order?.payload as Order | undefined)?.items ?? [];
  const missingWeight = orderItems.filter((it) => !(Number(it.weight) > 0));

  // Step 1: if some items have no weight, ask the admin for each before sending.
  const startShipment = () => {
    setShipErr(null);
    if (missingWeight.length && !weightAsk) {
      setWeightAsk(Object.fromEntries(missingWeight.map((it) => [it.productId, ''])));
      return;
    }
    void createShipment();
  };

  // Step 2: push the order into BTS (tracking + barcode come back from BTS).
  const createShipment = async () => {
    let weightOverride: number | undefined;
    if (weightAsk) {
      const entered = (pid: string) => Number((weightAsk[pid] || '').replace(',', '.'));
      if (missingWeight.some((it) => !(entered(it.productId) > 0))) {
        setShipErr('Har bir mahsulot uchun vaznni kiriting (kg).');
        return;
      }
      const total = orderItems.reduce((s, it) => {
        const w = Number(it.weight) > 0 ? Number(it.weight) : entered(it.productId);
        return s + w * (Number(it.quantity) || 1);
      }, 0);
      weightOverride = Math.max(0.1, Math.round(total * 1000) / 1000);
      // Remember the entered weights on the products so next orders know them.
      for (const it of missingWeight) {
        updateProduct(it.productId, { weight: entered(it.productId) });
      }
    }
    setCreating(true);
    try {
      const res = await fetch('/api/delivery/bts/shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, weight: weightOverride }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        setWeightAsk(null);
        const r2 = await fetch(`/api/orders/${id}`, { cache: 'no-store' });
        const d2 = await r2.json();
        setOrder((prev) => d2?.order ?? prev);
      } else if (data?.configured === false) {
        setShipErr('BTS sozlanmagan (server .env).');
      } else {
        setShipErr(data?.error || 'BTS xatosi. Qayta urinib koʻring.');
      }
    } catch {
      setShipErr('Tarmoq xatosi.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-white/45">Yuklanmoqda...</div>;
  }
  if (!order) {
    return (
      <div className="py-16 text-center text-sm text-white/45">
        Buyurtma topilmadi. <Link href="/admin/orders" className="text-brand-yellow">Orqaga</Link>
      </div>
    );
  }

  const p = order.payload || ({} as Order);
  const items = p.items || [];
  const d = p.delivery;
  const addr = d?.address;

  return (
    <div className="max-w-2xl space-y-5">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-brand-yellow">
        <ArrowLeft className="h-4 w-4" /> Buyurtmalar
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-display-sm font-extrabold">#{order.number}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-white/45">
            <Clock className="h-3 w-3" /> {formatDateTime(new Date(order.createdAt).toISOString())}
          </p>
        </div>
        <span className="rounded-lg bg-brand-yellow/15 px-3 py-1.5 text-sm font-bold text-brand-yellow">
          {STATUS_LABEL[order.status] || order.status}
        </span>
      </header>

      {/* Customer */}
      <section className="grid gap-3 sm:grid-cols-2">
        <InfoCard icon={User} title="Mijoz" lines={[order.customerName || p.contact?.name || '—']} />
        <InfoCard icon={Phone} title="Telefon" lines={[order.phone || p.contact?.phone || '—']} />
        <InfoCard
          icon={Truck}
          title="Yetkazib berish"
          lines={[
            DELIVERY_LABEL[d?.method || ''] || d?.method || '—',
            d?.bts?.branchName ? `${d.bts.branchName}${d.bts.cityName ? ', ' + d.bts.cityName : ''}` : '',
            addr ? `${addr.city || ''} ${addr.street || ''} ${addr.apartment || ''}`.trim() : '',
          ].filter(Boolean)}
        />
        <InfoCard
          icon={Wallet}
          title="To'lov"
          lines={[
            PAYMENT_LABEL[p.payment?.method || ''] || p.payment?.method || '—',
            p.payment?.paid ? "✅ To'langan" : "To'lanmagan",
          ]}
        />
      </section>

      {/* BTS shipment — create with one tap, then shows tracking + status */}
      {(d?.method === 'bts' || d?.method === 'post' || d?.method === 'courier') && (
        <section className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/45">
            <Truck className="h-4 w-4 text-brand-yellow" /> BTS yetkazish
          </h2>

          {order.bts?.barcode ? (
            <div className="space-y-1.5 text-sm">
              <div>
                <span className="text-white/45">Barcode:</span>{' '}
                <span className="font-mono font-bold">{order.bts.barcode}</span>
              </div>
              {order.bts.cost != null && (
                <div>
                  <span className="text-white/45">Yetkazish narxi:</span>{' '}
                  <span className="font-bold">{formatPrice(order.bts.cost)}</span>
                </div>
              )}
              {order.bts.tracking && (
                <a
                  href={order.bts.tracking}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-brand-yellow hover:underline"
                >
                  🔍 Kuzatish (tracking)
                </a>
              )}
              <p className="pt-1 text-xs font-semibold text-success">✅ BTS joʻnatma yaratilgan</p>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-xs text-white/55">
                Buyurtmani BTS tizimiga topshiring — trek-raqam avtomatik olinadi.
              </p>

              {/* Missing weights: ask per product before sending to BTS */}
              {weightAsk && (
                <div className="mb-3 space-y-2 rounded-xl border border-brand-yellow/30 bg-brand-yellow/5 p-3">
                  <p className="text-xs font-bold text-brand-yellow">
                    ⚖️ Quyidagi mahsulotlarning vazni kiritilmagan — BTS narxi vazndan
                    hisoblanadi. Har biri uchun vaznni kiriting (kg):
                  </p>
                  {missingWeight.map((it) => (
                    <label key={it.productId} className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs text-white/75">{it.name}</span>
                      <input
                        value={weightAsk[it.productId] ?? ''}
                        onChange={(e) =>
                          setWeightAsk((w) => ({ ...(w ?? {}), [it.productId]: e.target.value }))
                        }
                        placeholder="0.5"
                        inputMode="decimal"
                        className="w-20 shrink-0 rounded-lg border border-brand-surface-border bg-brand-dark px-2 py-1.5 text-right text-sm text-white outline-none focus:border-brand-yellow/60"
                      />
                      <span className="shrink-0 text-xs text-white/45">kg</span>
                    </label>
                  ))}
                  <p className="text-[10px] text-white/40">
                    Kiritilgan vazn mahsulot kartasiga ham saqlanadi — keyingi buyurtmalarda qayta so‘ralmaydi.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startShipment}
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-yellow px-4 py-2.5 text-sm font-bold text-brand-dark shadow-glow-sm transition-all hover:brightness-110 disabled:opacity-50 touch-feedback"
                >
                  <Truck className="h-4 w-4" />
                  {creating ? 'Yaratilmoqda…' : weightAsk ? '✅ Vazn tayyor — BTSga yuborish' : "🚚 BTS joʻnatma yaratish"}
                </button>
                {weightAsk && (
                  <button
                    type="button"
                    onClick={() => setWeightAsk(null)}
                    className="rounded-xl border border-brand-surface-border px-3 py-2.5 text-sm text-white/60 hover:text-white"
                  >
                    Bekor
                  </button>
                )}
              </div>
              {shipErr && <p className="mt-2 text-xs text-danger">⚠️ {shipErr}</p>}
            </div>
          )}
        </section>
      )}

      {/* Items — what they ordered */}
      <section className="rounded-2xl border border-brand-surface-border bg-brand-surface">
        <h2 className="flex items-center gap-1.5 border-b border-brand-surface-border px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/45">
          <Package className="h-4 w-4 text-brand-yellow" /> Tovarlar ({items.length})
        </h2>
        <ul className="divide-y divide-brand-surface-border">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-brand-dark">
                <ProductImage src={it.image} alt="" className="h-full w-full object-cover" fallbackClassName="h-full w-full" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{it.name}</p>
                <p className="text-xs text-white/45">{formatPrice(it.price)} × {it.quantity}</p>
              </div>
              <span className="shrink-0 font-display text-sm font-extrabold text-brand-yellow">
                {formatPrice(it.price * it.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="space-y-1.5 border-t border-brand-surface-border px-4 py-3 text-sm">
          <Row label="Tovarlar" value={formatPrice(p.subtotal ?? order.total)} />
          {Boolean(p.discount) && <Row label="Chegirma" value={`− ${formatPrice(p.discount)}`} />}
          {p.deliveryFee != null && <Row label="Yetkazib berish" value={p.deliveryFee ? formatPrice(p.deliveryFee) : 'Bepul'} />}
          <div className="flex items-center justify-between border-t border-brand-surface-border pt-2">
            <span className="font-bold text-white/70">Jami</span>
            <span className="font-display text-lg font-extrabold text-brand-yellow">{formatPrice(order.total)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ icon: Icon, title, lines }: { icon: typeof User; title: string; lines: string[] }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-brand-surface-border bg-brand-surface p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-yellow/10 text-brand-yellow">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-white/45">{title}</p>
        {lines.map((l, i) => (
          <p key={i} className={i === 0 ? 'text-sm font-bold' : 'text-xs text-white/60'}>{l}</p>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/55">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
