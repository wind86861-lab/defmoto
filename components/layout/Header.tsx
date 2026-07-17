'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  MoreHorizontal,
  Phone,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/ui/Logo';
import { IconButton } from '@/components/ui/IconButton';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { MarketplaceLinks } from '@/components/features/MarketplaceLinks';
import { useCartStore } from '@/lib/stores/cart';
import { useWishlistStore } from '@/lib/stores/wishlist';
import { useSiteSettings } from '@/lib/stores/siteSettings';
import { useMounted } from '@/hooks/useMounted';

interface NavItem {
  href: string;
  key: string;
}

const mainNav: NavItem[] = [
  { href: '/', key: 'home' },
  { href: '/branches', key: 'branches' },
  { href: '/service', key: 'service' },
  { href: '/chat', key: 'chat' },
  { href: '/blog', key: 'blog' },
  { href: '/about', key: 'about' },
];

export function Header() {
  const t = useTranslations('common');
  const tNav = useTranslations('nav');
  const tContact = useTranslations('contact');
  const mounted = useMounted();
  const cartCount = useCartStore((s) => (mounted ? s.items.length : 0));
  const wishlistCount = useWishlistStore((s) => (mounted ? s.ids.length : 0));
  const pathname = usePathname();
  // Admin-set contact phone (Sayt sozlamalari) — i18n value is only a fallback.
  const storedPhone = useSiteSettings((s) => s.contact?.phone);
  const phone = (mounted && storedPhone?.trim()) || tContact('phone');

  return (
    <header className="sticky top-0 z-40 safe-top border-b border-brand-surface-border/60 bg-brand-dark/90 backdrop-blur-xl">
      {/* ===== Row 1 ===== */}
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-3 px-4 sm:h-16 sm:gap-4 xl:h-20 xl:gap-5 xl:px-8">
        {/* Logo */}
        <Link href="/" className="shrink-0" aria-label="DEFT MOTO">
          <span className="block sm:hidden">
            <Logo size="sm" showText={false} />
          </span>
          <span className="hidden sm:block xl:hidden">
            <Logo size="sm" showText />
          </span>
          <span className="hidden xl:block">
            <Logo size="lg" showText />
          </span>
        </Link>

        {/* Catalog button — desktop */}
        <Link
          href="/catalog"
          className="hidden h-12 shrink-0 items-center gap-2 rounded-2xl bg-gradient-yellow px-5 font-bold text-brand-dark shadow-glow-sm transition-all hover:brightness-110 active:scale-[0.98] xl:inline-flex"
        >
          <Menu className="h-5 w-5" strokeWidth={2.5} />
          <span className="text-[15px]">{tNav('catalog')}</span>
        </Link>

        {/* Search bar */}
        <Link
          href="/search"
          className="group flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 text-sm text-white/45 transition-colors hover:border-brand-yellow/40 xl:h-12 xl:rounded-2xl xl:px-5 xl:text-base"
        >
          <Search className="h-4 w-4 transition-colors group-hover:text-brand-yellow xl:order-2 xl:ml-auto xl:hidden" />
          <span className="truncate">{t('searchPlaceholder')}</span>
          <span className="ml-auto hidden h-9 w-9 items-center justify-center rounded-xl bg-gradient-yellow text-brand-dark transition-all group-hover:brightness-110 xl:flex">
            <Search className="h-4 w-4" strokeWidth={2.5} />
          </span>
        </Link>

        {/* Mobile actions */}
        <div className="flex items-center gap-1 xl:hidden">
          <LanguageSwitcher variant="icon" />
          <Link href="/wishlist" aria-label={tNav('wishlist')}>
            <IconButton
              icon={<Heart className="h-5 w-5" />}
              label={tNav('wishlist')}
              variant="ghost"
              badge={wishlistCount}
            />
          </Link>
          <Link href="/cart" aria-label={tNav('cart')}>
            <IconButton
              icon={<ShoppingBag className="h-5 w-5" />}
              label={tNav('cart')}
              variant="ghost"
              badge={cartCount}
            />
          </Link>
        </div>

        {/* Desktop actions — labeled */}
        <nav className="hidden items-center gap-1 xl:flex">
          <LanguageSwitcher variant="icon" />
          <ActionLink
            href="/wishlist"
            icon={<Heart className="h-5 w-5" />}
            label={tNav('wishlist')}
            badge={wishlistCount}
          />
          <ActionLink
            href="/cart"
            icon={<ShoppingBag className="h-5 w-5" />}
            label={tNav('cart')}
            badge={cartCount}
          />
          <ActionLink
            href="/profile"
            icon={<User className="h-5 w-5" />}
            label={t('login')}
          />
          <button
            type="button"
            aria-label={t('more')}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-white/65 transition-colors hover:bg-white/8 hover:text-brand-yellow"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </nav>
      </div>

      {/* ===== Row 2 — sub-nav (xl+ only) ===== */}
      <div className="hidden border-t border-brand-surface-border/40 xl:block">
        <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-4 px-4 xl:px-8">
          <ul className="flex min-w-0 flex-1 items-center justify-between gap-1 pr-4">
            {mainNav.map((item) => {
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href ||
                    pathname.startsWith(item.href + '/');
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    className={cn(
                      'inline-flex h-10 items-center whitespace-nowrap rounded-lg px-4 text-[15px] font-bold transition-colors',
                      active
                        ? 'text-brand-yellow'
                        : 'text-white/75 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    {tNav(item.key)}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Phone + socials */}
          <div className="flex shrink-0 items-center gap-3">
            <a
              href={`tel:+${phone.replace(/\D/g, '')}`}
              className="group flex items-center gap-2 whitespace-nowrap text-sm font-bold text-white transition-colors hover:text-brand-yellow"
              aria-label={tContact('callUs')}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success/15 text-success transition-colors group-hover:bg-brand-yellow/15 group-hover:text-brand-yellow">
                <Phone className="h-3.5 w-3.5" fill="currentColor" />
              </span>
              <span>{phone}</span>
            </a>
            <MarketplaceLinks size="sm" />
          </div>
        </div>
      </div>
    </header>
  );
}

function ActionLink({
  href,
  icon,
  label,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="group relative inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/85 transition-colors hover:bg-white/5 hover:text-brand-yellow"
    >
      <span className="relative text-white/80 transition-colors group-hover:text-brand-yellow">
        {icon}
        {typeof badge === 'number' && badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-yellow px-1 text-[9px] font-bold text-brand-dark shadow-glow-sm">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <span>{label}</span>
    </Link>
  );
}

