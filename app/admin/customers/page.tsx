'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Users, Phone, Send, Search, Package, ChevronDown, Headset } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/Input';
import { formatPrice, formatDateTime } from '@/lib/format';

interface CustomerOrder {
  id: string;
  number: string;
  status: string;
  total: number;
  createdAt: number;
}
interface Customer {
  id: string;
  name: string;
  phone: string;
  telegramId: string | null;
  createdAt: number;
  isOperator: boolean;
  orderCount: number;
  spent: number;
  orders: CustomerOrder[];
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Kutilmoqda',
  paid: "To'landi",
  confirmed: 'Tasdiqlandi',
  shipping: 'Yetkazilmoqda',
  delivered: 'Yetkazildi',
  cancelled: 'Bekor',
  expired: "Muddati o'tdi",
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/customers', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setCustomers(d?.customers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Operators live in their own section — show only real customers here.
  const nonOperators = useMemo(() => customers.filter((c) => !c.isOperator), [customers]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return nonOperators;
    return nonOperators.filter(
      (c) => c.name?.toLowerCase().includes(s) || (c.phone || '').includes(s.replace(/\D/g, '')),
    );
  }, [nonOperators, q]);

  const totals = useMemo(
    () => ({
      count: nonOperators.length,
      orders: nonOperators.reduce((s, c) => s + c.orderCount, 0),
      spent: nonOperators.reduce((s, c) => s + c.spent, 0),
    }),
    [nonOperators],
  );

  const makeOperator = async (c: Customer) => {
    if (!confirm(`"${c.name || 'Mijoz'}" ni operator qilib belgilaysizmi? U "Operatorlar" boʻlimiga oʻtadi.`)) return;
    setBusyId(c.id);
    try {
      const res = await fetch('/api/admin/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: c.id, makeOperator: true }),
      });
      if (res.ok) {
        setCustomers((prev) => prev.map((x) => (x.id === c.id ? { ...x, isOperator: true } : x)));
        setOpenId(null);
      }
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-display-sm font-extrabold sm:text-display-md">
          <Users className="h-6 w-6 text-brand-yellow" />
          Klientlar
        </h1>
        <p className="mt-1 text-sm text-white/55">Roʻyxatdan oʻtgan mijozlar va ularning buyurtmalari.</p>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Mijozlar" value={String(totals.count)} />
        <Stat label="Buyurtmalar" value={String(totals.orders)} />
        <Stat label="Umumiy savdo" value={formatPrice(totals.spent)} />
      </div>

      {/* Search */}
      <Input
        placeholder="Ism yoki telefon boʻyicha qidirish"
        leftIcon={<Search className="h-4 w-4" />}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {/* List */}
      <div className="space-y-2.5">
        {loading ? (
          <p className="rounded-xl border border-dashed border-brand-surface-border px-3 py-6 text-center text-sm text-white/45">
            Yuklanmoqda...
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-brand-surface-border px-3 py-6 text-center text-sm text-white/45">
            Mijoz topilmadi.
          </p>
        ) : (
          filtered.map((c) => {
            const open = openId === c.id;
            return (
              <div key={c.id} className="overflow-hidden rounded-2xl border border-brand-surface-border bg-brand-surface">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : c.id)}
                  className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/3"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-yellow font-display text-base font-extrabold text-brand-dark">
                    {(c.name || 'M').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{c.name || 'Mijoz'}</p>
                    <p className="mt-0.5 flex items-center gap-3 text-xs text-white/55">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> +{c.phone}
                      </span>
                      {c.telegramId && (
                        <span className="inline-flex items-center gap-1 text-[#229ED9]">
                          <Send className="h-3 w-3" /> TG
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-sm font-extrabold text-brand-yellow">{formatPrice(c.spent)}</p>
                    <p className="text-[10px] text-white/45">{c.orderCount} ta buyurtma</p>
                  </div>
                  <ChevronDown className={cn('h-4 w-4 shrink-0 text-white/40 transition-transform', open && 'rotate-180')} />
                </button>

                {open && (
                  <div className="border-t border-brand-surface-border p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                        Roʻyxatdan oʻtgan: {formatDateTime(new Date(c.createdAt).toISOString())}
                      </p>
                      <button
                        type="button"
                        onClick={() => makeOperator(c)}
                        disabled={busyId === c.id}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-yellow/40 bg-brand-yellow/10 px-2.5 py-1.5 text-[11px] font-bold text-brand-yellow transition-colors hover:bg-brand-yellow/20 disabled:opacity-50 touch-feedback"
                      >
                        <Headset className="h-3.5 w-3.5" />
                        {busyId === c.id ? '...' : 'Operator qilish'}
                      </button>
                    </div>
                    {c.orders.length === 0 ? (
                      <p className="text-sm text-white/45">Hali buyurtma yoʻq.</p>
                    ) : (
                      <ul className="space-y-2">
                        {c.orders.map((o) => (
                          <li key={o.id}>
                            <Link
                              href={`/admin/orders/${o.id}`}
                              className="flex items-center gap-3 rounded-xl bg-brand-dark/40 px-3 py-2.5 transition-colors hover:bg-brand-dark/70"
                            >
                              <Package className="h-4 w-4 shrink-0 text-brand-yellow" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold">#{o.number}</p>
                                <p className="text-[10px] text-white/45">{formatDateTime(new Date(o.createdAt).toISOString())}</p>
                              </div>
                              <span className="shrink-0 rounded-md bg-white/8 px-2 py-0.5 text-[10px] font-bold text-white/70">
                                {STATUS_LABEL[o.status] || o.status}
                              </span>
                              <span className="shrink-0 font-display text-sm font-bold text-brand-yellow">
                                {formatPrice(o.total)}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-brand-surface-border bg-brand-surface px-3 py-3 text-center">
      <p className="font-display text-lg font-extrabold text-brand-yellow">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-white/45">{label}</p>
    </div>
  );
}
