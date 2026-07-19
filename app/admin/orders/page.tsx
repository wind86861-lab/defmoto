'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Eye, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/Input';
import { formatPrice, formatDateTime } from '@/lib/format';
import { useHaptic } from '@/hooks/useHaptic';
import { OrderStatusBadge, getOrderStatusMeta } from '@/features/orders/OrderStatus';
import type { Order, OrderStatus } from '@/types/order';

const STATUS_OPTIONS: OrderStatus[] = [
  'pending',
  'confirmed',
  'paid',
  'shipping',
  'delivered',
  'cancelled',
];

interface ServerOrder {
  id: string;
  number: string;
  status: OrderStatus;
  customerName?: string;
  phone?: string;
  total: number;
  createdAt: number;
  payload: Order;
  bts?: { barcode?: string; tracking?: string };
}

/** BTS shipment state chip for an order row. */
function BtsChip({ o }: { o: ServerOrder }) {
  const isBts = o.payload?.delivery?.method === 'bts' || o.payload?.delivery?.method === 'post';
  if (!isBts) return null;
  return o.bts?.barcode ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">
      🚚 BTS: {o.bts.barcode}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md bg-brand-yellow/15 px-1.5 py-0.5 text-[10px] font-bold text-brand-yellow">
      🚚 BTS — joʻnatma yaratilmagan
    </span>
  );
}

export default function AdminOrdersPage() {
  const t = useTranslations('orders');
  const tAdmin = useTranslations('admin');
  const statusMeta = getOrderStatusMeta(t);
  const { notify } = useHaptic();
  const [orders, setOrders] = useState<ServerOrder[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');

  const load = useCallback(() => {
    fetch('/api/orders', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [load]);

  const itemsCount = (o: ServerOrder) => o.payload?.items?.length ?? 0;
  const name = (o: ServerOrder) => o.customerName || o.payload?.contact?.name || '—';
  const phone = (o: ServerOrder) => o.phone || o.payload?.contact?.phone || '';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (
        q &&
        !o.number.toLowerCase().includes(q) &&
        !name(o).toLowerCase().includes(q) &&
        !phone(o).includes(q)
      )
        return false;
      if (statusFilter && o.status !== statusFilter) return false;
      return true;
    });
  }, [orders, query, statusFilter]);

  const handleStatusChange = (id: string, status: OrderStatus) => {
    notify('success');
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-display-sm font-extrabold sm:text-display-md">
            {tAdmin('navOrders')}
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {tAdmin('totalLabel')} <span className="font-bold text-white">{orders.length}</span> ·{' '}
            {tAdmin('filteredLabel')} <span className="font-bold text-brand-yellow">{filtered.length}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-xl border border-brand-surface-border bg-brand-surface px-3 py-2 text-sm font-semibold text-white/75 transition-colors hover:border-brand-yellow/40 hover:text-brand-yellow"
        >
          <RotateCcw className="h-4 w-4" />
          {tAdmin('refreshButton')}
        </button>
      </header>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 scrollbar-hide">
        <StatusPill label={tAdmin('stockAllOption')} count={orders.length} active={!statusFilter} onClick={() => setStatusFilter('')} />
        {STATUS_OPTIONS.map((s) => (
          <StatusPill
            key={s}
            label={statusMeta[s].label}
            count={orders.filter((o) => o.status === s).length}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
          />
        ))}
      </div>

      <Input
        placeholder={tAdmin('orderSearchPlaceholder')}
        leftIcon={<Search className="h-4 w-4" />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* Table — desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-brand-surface-border bg-brand-surface lg:block">
        <table className="w-full">
          <thead className="bg-brand-dark/40 text-left text-[11px] font-bold uppercase tracking-wider text-white/45">
            <tr>
              <th className="px-4 py-3">{tAdmin('tableHeadOrder')}</th>
              <th className="px-4 py-3">{tAdmin('tableHeadCustomer')}</th>
              <th className="px-4 py-3">{tAdmin('tableHeadDate')}</th>
              <th className="px-4 py-3">{tAdmin('tableHeadSum')}</th>
              <th className="px-4 py-3">{tAdmin('tableHeadStatus')}</th>
              <th className="px-4 py-3 text-right">{tAdmin('tableHeadActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-surface-border">
            {filtered.map((o) => (
              <tr key={o.id} className="transition-colors hover:bg-white/3">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-display text-sm font-bold text-white transition-colors hover:text-brand-yellow">
                    #{o.number}
                  </Link>
                  <div className="text-[11px] text-white/45">{tAdmin('productCountText', { count: itemsCount(o) })}</div>
                  <div className="mt-1"><BtsChip o={o} /></div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="font-semibold">{name(o)}</div>
                  <div className="text-[11px] text-white/45">{phone(o)}</div>
                </td>
                <td className="px-4 py-3 text-sm text-white/65">{formatDateTime(new Date(o.createdAt).toISOString())}</td>
                <td className="px-4 py-3">
                  <div className="font-display text-sm font-extrabold text-brand-yellow">{formatPrice(o.total)}</div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                    className={cn(
                      'h-8 rounded-lg border bg-brand-dark px-2 text-xs font-bold uppercase tracking-wider outline-none',
                      o.status === 'cancelled'
                        ? 'border-danger/40 text-danger'
                        : o.status === 'delivered' || o.status === 'paid'
                          ? 'border-success/40 text-success'
                          : 'border-brand-yellow/40 text-brand-yellow',
                    )}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="bg-brand-dark text-white">
                        {statusMeta[s].label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-brand-yellow/40 bg-brand-yellow/10 px-2.5 text-[11px] font-bold text-brand-yellow transition-colors hover:bg-brand-yellow/20"
                  >
                    Ochish
                  </Link>
                  <Link
                    href={`/orders/${o.id}`}
                    target="_blank"
                    className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/8 hover:text-brand-yellow"
                    aria-label={tAdmin('viewCustomerSideAria')}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-white/45">
            {orders.length === 0 ? tAdmin('noOrdersText') : tAdmin('noFilterResultsText')}
          </div>
        )}
      </div>

      {/* Cards — mobile */}
      <div className="space-y-2 lg:hidden">
        {filtered.map((o) => (
          <div key={o.id} className="rounded-xl border border-brand-surface-border bg-brand-surface p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/admin/orders/${o.id}`} className="font-display text-sm font-bold text-brand-yellow">
                  #{o.number} →
                </Link>
                <div className="mt-0.5 text-[11px] text-white/45">
                  {formatDateTime(new Date(o.createdAt).toISOString())} · {name(o)}
                </div>
                <div className="text-[11px] text-white/45">{phone(o)}</div>
                <div className="mt-1"><BtsChip o={o} /></div>
              </div>
              <OrderStatusBadge status={o.status} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <select
                value={o.status}
                onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                className="h-8 rounded-lg border border-brand-surface-border bg-brand-dark px-2 text-[11px] font-bold uppercase tracking-wider text-white outline-none"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="bg-brand-dark text-white">
                    {statusMeta[s].label}
                  </option>
                ))}
              </select>
              <div className="font-display text-sm font-extrabold text-brand-yellow">{formatPrice(o.total)}</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-brand-surface-border py-10 text-center text-sm text-white/45">
            {orders.length === 0 ? tAdmin('noOrdersText') : tAdmin('noFilterResultsText')}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
        active
          ? 'border-brand-yellow bg-brand-yellow text-brand-dark'
          : 'border-brand-surface-border bg-brand-surface text-white/75 hover:border-brand-yellow/40 hover:text-white',
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
          active ? 'bg-brand-dark/20 text-brand-dark' : 'bg-brand-dark/40 text-white/55',
        )}
      >
        {count}
      </span>
    </button>
  );
}
