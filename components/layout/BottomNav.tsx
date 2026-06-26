'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, Grid3x3, ShoppingBag, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCartStore } from '@/lib/stores/cart';
import { useMounted } from '@/hooks/useMounted';

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const mounted = useMounted();
  const cartCount = useCartStore((s) => (mounted ? s.totalCount() : 0));

  const items = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/catalog', label: t('catalog'), icon: Grid3x3 },
    { href: '/cart', label: t('cart'), icon: ShoppingBag, badge: cartCount },
    { href: '/chat', label: t('chat'), icon: MessageCircle },
    { href: '/profile', label: t('profile'), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom border-t border-brand-surface-border/60 bg-brand-dark/95 backdrop-blur-xl xl:hidden">
      <div className="flex h-16 items-stretch">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-0.5 no-tap-highlight touch-feedback',
                'transition-colors duration-200',
                active ? 'text-brand-yellow' : 'text-white/55',
              )}
            >
              {active && (
                <span className="absolute inset-x-6 top-0 h-0.5 rounded-b-full bg-brand-yellow shadow-glow-sm" />
              )}
              <div className="relative">
                <Icon
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    active && 'scale-110',
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-yellow px-1 text-[9px] font-bold text-brand-dark shadow-glow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
