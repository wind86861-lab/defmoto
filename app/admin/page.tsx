'use client';

import Link from 'next/link';
import {
  ShoppingBag,
  Package,
  Users,
  MessageCircle,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Tag,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { formatPrice, formatNumber, formatDateTime } from '@/lib/format';
import { useOrdersStore } from '@/lib/stores/orders';
import { useMounted } from '@/hooks/useMounted';
import { mockProducts } from '@/mocks/products';
import { mockCategories } from '@/mocks/categories';
import { OrderStatusBadge } from '@/features/orders/OrderStatus';

export default function AdminDashboardPage() {
  const t = useTranslations('admin');
  const mounted = useMounted();
  const orders = useOrdersStore((s) => s.orders);

  const stats = useMemo(() => {
    if (!mounted) {
      return {
        ordersToday: 0,
        revenue: 0,
        paidOrders: 0,
        avgOrder: 0,
      };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(
      (o) => new Date(o.createdAt) >= today,
    );
    const paid = orders.filter((o) => o.payment.paid);
    const revenue = paid.reduce((sum, o) => sum + o.total, 0);
    return {
      ordersToday: todayOrders.length,
      revenue,
      paidOrders: paid.length,
      avgOrder: paid.length ? Math.round(revenue / paid.length) : 0,
    };
  }, [mounted, orders]);

  const recent = mounted ? orders.slice(0, 5) : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-display-sm font-extrabold sm:text-display-md">
            {t('dashboardTitle')}
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {t('dashboardSubtitle')}
          </p>
        </div>
        <Link
          href="/admin/hero"
          className="inline-flex items-center gap-1.5 rounded-xl border border-brand-yellow/40 bg-brand-yellow/10 px-3 py-2 text-sm font-bold text-brand-yellow transition-colors hover:bg-brand-yellow/15"
        >
          <Sparkles className="h-4 w-4" />
          {t('editHeroLink')}
        </Link>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          label={t('kpiTodayOrders')}
          value={formatNumber(stats.ordersToday)}
          icon={<ShoppingBag className="h-5 w-5" />}
          trend="+12%"
        />
        <KpiCard
          label={t('kpiRevenue')}
          value={formatPrice(stats.revenue)}
          icon={<TrendingUp className="h-5 w-5" />}
          trend="+8%"
          accent
        />
        <KpiCard
          label={t('kpiPaid')}
          value={formatNumber(stats.paidOrders)}
          icon={<Package className="h-5 w-5" />}
          trend={t('totalCountSuffix', { count: orders.length })}
        />
        <KpiCard
          label={t('kpiAvgCheck')}
          value={formatPrice(stats.avgOrder)}
          icon={<Users className="h-5 w-5" />}
          trend="—"
        />
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        <QuickStat
          icon={Package}
          label={t('navProducts')}
          value={formatNumber(mockProducts.length)}
          href="/admin/products"
        />
        <QuickStat
          icon={Tag}
          label={t('navCategories')}
          value={formatNumber(mockCategories.length)}
          href="/admin/categories"
        />
        <QuickStat
          icon={MessageCircle}
          label={t('quickStatActiveChats')}
          value="1"
          href="/admin/chats"
        />
      </div>

      {/* Recent orders */}
      <section className="rounded-2xl border border-brand-surface-border bg-brand-surface">
        <header className="flex items-center justify-between border-b border-brand-surface-border px-5 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/65">
            {t('recentOrdersTitle')}
          </h2>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-yellow hover:underline"
          >
            {t('viewAllLink')} <ArrowUpRight className="h-3 w-3" />
          </Link>
        </header>

        {recent.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-white/45">
            {t('emptyOrdersTitle')}
          </div>
        ) : (
          <ul className="divide-y divide-brand-surface-border">
            {recent.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-yellow/15 font-display text-xs font-extrabold text-brand-yellow">
                    {order.items.length}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold">
                      #{order.number}
                    </p>
                    <p className="text-[11px] text-white/45">
                      {formatDateTime(order.createdAt)} · {order.contact.name}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                  <div className="text-right">
                    <div className="font-display text-sm font-extrabold text-brand-yellow">
                      {formatPrice(order.total)}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  trend,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4 sm:p-5',
        accent
          ? 'border-brand-yellow/40 bg-gradient-to-br from-brand-surface to-brand-dark shadow-glow-sm'
          : 'border-brand-surface-border bg-brand-surface',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-yellow/15 text-brand-yellow">
          {icon}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-success">
          {trend}
        </span>
      </div>
      <div className="mt-3">
        <div className="font-display text-xl font-extrabold sm:text-2xl">
          {value}
        </div>
        <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-white/55">
          {label}
        </div>
      </div>
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-brand-surface-border bg-brand-surface p-4 transition-all hover:border-brand-yellow/40 hover:shadow-card-hover"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-yellow text-brand-dark shadow-glow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-white/55">
          {label}
        </div>
        <div className="font-display text-lg font-extrabold">{value}</div>
      </div>
      <ArrowUpRight className="h-4 w-4 text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-yellow" />
    </Link>
  );
}
