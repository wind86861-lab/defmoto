'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Image,
  Package,
  ShoppingBag,
  Tag,
  MessageCircle,
  Store,
  MapPin,
  Truck,
  Link2,
  Users,
  Headset,
  Newspaper,
  Inbox,
  Settings,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/ui/Logo';
import { useAdminAuth } from '@/lib/stores/admin';
import { useMounted } from '@/hooks/useMounted';
import { RoadDashLoader } from '@/components/ui/MotoLoader';

export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations('admin');
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useMounted();
  const isAuthed = useAdminAuth((s) => s.isAuthed);
  const markAuthed = useAdminAuth((s) => s.markAuthed);
  const logout = useAdminAuth((s) => s.logout);

  // Verify the real server session — stale client state without a valid
  // cookie must not show the admin (its API calls would 401 anyway).
  useEffect(() => {
    if (!mounted || pathname === '/admin/login') return;
    fetch('/api/admin/login', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.authed) markAuthed();
        else {
          logout();
          router.replace('/admin/login');
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, pathname]);

  const doLogout = () => {
    fetch('/api/admin/login', { method: 'DELETE' }).catch(() => {});
    logout();
    router.replace('/admin/login');
  };

  const nav = [
    { href: '/admin', label: t('navDashboard'), icon: LayoutDashboard, exact: true },
    { href: '/admin/hero', label: t('navBanner'), icon: Image },
    { href: '/admin/products', label: t('navProducts'), icon: Package },
    { href: '/admin/orders', label: t('navOrders'), icon: ShoppingBag },
    { href: '/admin/leads', label: t('navLeads'), icon: Inbox },
    { href: '/admin/customers', label: t('navCustomers'), icon: Users },
    { href: '/admin/operators', label: t('navOperators'), icon: Headset },
    { href: '/admin/categories', label: t('navCategories'), icon: Tag },
    { href: '/admin/locations', label: t('navLocations'), icon: MapPin },
    { href: '/admin/marketplaces', label: t('navMarketplaces'), icon: Store },
    { href: '/admin/delivery', label: t('navDelivery'), icon: Truck },
    { href: '/admin/links', label: t('navLinks'), icon: Link2 },
    { href: '/admin/blog', label: t('navBlog'), icon: Newspaper },
    { href: '/admin/settings', label: t('navSettings'), icon: Settings },
    { href: '/admin/chats', label: t('navChats'), icon: MessageCircle },
  ];

  // Redirect to login if not authed
  useEffect(() => {
    if (!mounted) return;
    if (!isAuthed && pathname !== '/admin/login') {
      router.replace('/admin/login');
    }
  }, [mounted, isAuthed, pathname, router]);

  // Don't render shell on the login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!mounted || !isAuthed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-dark">
        <RoadDashLoader size="lg" label={t('checkingAuthLabel')} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-brand-dark">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-brand-surface-border bg-brand-surface lg:flex">
        <div className="flex items-center gap-2 border-b border-brand-surface-border px-5 py-4">
          <Logo size="sm" />
          <span className="ml-1 rounded-md bg-brand-yellow/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-yellow">
            {t('adminBadge')}
          </span>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3 scrollbar-hide">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                  active
                    ? 'bg-brand-yellow/15 text-brand-yellow shadow-glow-sm'
                    : 'text-white/65 hover:bg-white/5 hover:text-white',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    active ? 'text-brand-yellow' : 'text-white/45 group-hover:text-white',
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-brand-surface-border p-3">
          <Link
            href="/"
            target="_blank"
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/65 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ExternalLink className="h-4 w-4 text-white/45 group-hover:text-white" />
            <span>{t('viewSiteLink')}</span>
          </Link>
          <button
            type="button"
            onClick={doLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/65 transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <LogOut className="h-4 w-4 text-white/45 group-hover:text-danger" />
            <span>{t('logoutButton')}</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0 flex-1">
        {/* Top bar — mobile only nav trigger area */}
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-brand-surface-border bg-brand-dark/95 px-4 py-3 backdrop-blur-xl lg:hidden">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo size="sm" showText={false} />
            <span className="font-display text-base font-bold">{t('adminBadge')}</span>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="rounded-lg border border-brand-surface-border bg-brand-surface px-3 py-1.5 text-xs font-semibold text-white/75"
          >
            {t('viewSiteLink')}
          </Link>
        </div>

        {/* Mobile nav scroll */}
        <div className="-mx-px overflow-x-auto border-b border-brand-surface-border bg-brand-surface lg:hidden">
          <ul className="flex">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 whitespace-nowrap px-4 py-3 text-xs font-bold',
                      active
                        ? 'border-b-2 border-brand-yellow text-brand-yellow'
                        : 'border-b-2 border-transparent text-white/55',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
