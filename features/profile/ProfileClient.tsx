'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Package,
  Heart,
  MapPin,
  MessageCircle,
  Send,
  LogOut,
  LogIn,
  ChevronRight,
  Phone,
  Mail,
} from 'lucide-react';
import { useTelegram } from '@/components/providers/TelegramProvider';
import { useAuth } from '@/hooks/useAuth';
import { useOrdersStore } from '@/lib/stores/orders';
import { useWishlistStore } from '@/lib/stores/wishlist';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'ajndspuntnjqpiuuerbot';
const REGISTER_LINK = `https://t.me/${BOT_USERNAME}?start=register`;

export function ProfileClient() {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const { user, isInTelegram, webApp } = useTelegram();
  const { user: account, logout } = useAuth();
  const orderCount = useOrdersStore((s) => s.orders.length);
  const wishlistCount = useWishlistStore((s) => s.ids.length);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-6 sm:px-6 sm:py-10">
      {/* User card */}
      <section className="relative overflow-hidden rounded-3xl border border-brand-yellow/30 bg-gradient-to-br from-brand-surface to-brand-dark p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-yellow/15 blur-3xl" />
        <div className="relative flex items-center gap-4">
          {user?.photo_url ? (
            <img
              src={user.photo_url}
              alt={user.first_name}
              className="h-16 w-16 rounded-full ring-2 ring-brand-yellow/50 ring-offset-2 ring-offset-brand-dark"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-yellow font-display text-2xl font-extrabold text-brand-dark shadow-glow-sm">
              {user?.first_name?.[0] ?? '👤'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-display-sm font-extrabold">
              {user
                ? `${user.first_name} ${user.last_name ?? ''}`
                : account?.name || account?.phone || t('guestName')}
            </h1>
            {user?.username && (
              <p className="text-sm text-white/65">@{user.username}</p>
            )}
            {isInTelegram && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand-yellow/15 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-yellow">
                <Send className="h-2.5 w-2.5" /> {t('telegramBadge')}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatTile
            label={t('statsOrdersLabel')}
            value={orderCount}
            icon={<Package className="h-4 w-4" />}
            href="/orders"
          />
          <StatTile
            label={t('statsWishlistLabel')}
            value={wishlistCount}
            icon={<Heart className="h-4 w-4" />}
            href="/wishlist"
          />
        </div>
      </section>

      {/* Account — only while signed out. Registration is bot-only, so the
          Register row hands off to the Telegram bot's /start register flow. */}
      {!account && (
        <section className="mt-6 space-y-1.5">
          <SectionTitle>{tCommon('account')}</SectionTitle>
          <MenuLink href="/login" icon={LogIn} label={tCommon('login')} />
          <a
            href={REGISTER_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl bg-[#229ED9] p-4 text-white transition-transform hover:brightness-110 active:scale-[0.99] touch-feedback"
          >
            <Send className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-sm font-bold">{tCommon('register')}</span>
            <ChevronRight className="h-4 w-4 opacity-70" />
          </a>
        </section>
      )}

      {/* Menu sections */}
      <section className="mt-6 space-y-1.5">
        <MenuLink href="/orders" icon={Package} label={t('menuOrdersLabel')} />
        <MenuLink href="/wishlist" icon={Heart} label={t('menuWishlistLabel')} />
        <MenuLink href="/branches" icon={MapPin} label={t('menuBranchesLabel')} />
        <MenuLink
          href="/chat"
          icon={MessageCircle}
          label={t('menuChatLabel')}
          badge={t('chatOnlineBadge')}
        />
      </section>

      <section className="mt-6 space-y-1.5">
        <SectionTitle>{t('settingsSectionTitle')}</SectionTitle>
        <LanguageSwitcher />
      </section>

      <section className="mt-6 space-y-1.5">
        <SectionTitle>{t('helpSectionTitle')}</SectionTitle>
        <MenuLink
          href="tel:+998998107090"
          icon={Phone}
          label={t('contactPhone')}
          external
        />
        <MenuLink
          href="mailto:info@deftmoto.uz"
          icon={Mail}
          label={t('contactEmail')}
          external
        />
        <MenuLink
          href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'ajndspuntnjqpiuuerbot'}`}
          icon={Send}
          label={t('telegramBotLabel')}
          external
        />
      </section>

      {(isInTelegram || account?.source === 'account') && (
        <button
          type="button"
          onClick={() => {
            if (account?.source === 'account') void logout();
            else webApp?.close();
          }}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-surface-border bg-brand-surface p-4 text-sm font-semibold text-white/65 transition-colors hover:border-danger/40 hover:text-danger touch-feedback"
        >
          <LogOut className="h-4 w-4" />
          {t('logoutButton')}
        </button>
      )}

      <p className="mt-6 text-center text-[11px] text-white/35">
        {t('footerText')}
      </p>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-brand-surface-border bg-brand-dark/40 p-3 transition-all hover:border-brand-yellow/40 touch-feedback"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-yellow/10 text-brand-yellow">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
          {label}
        </p>
        <p className="font-display text-lg font-extrabold">{value}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-yellow" />
    </Link>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  badge,
  suffix,
  external,
}: {
  href: string;
  icon: typeof Package;
  label: string;
  badge?: string;
  suffix?: string;
  external?: boolean;
}) {
  const className =
    'group flex items-center gap-3 rounded-xl border border-brand-surface-border bg-brand-surface px-4 py-3 transition-colors hover:border-brand-yellow/40 touch-feedback';
  const inner = (
    <>
      <Icon className="h-4 w-4 text-white/55 transition-colors group-hover:text-brand-yellow" />
      <span className="flex-1 text-sm font-semibold">{label}</span>
      {badge && (
        <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
          {badge}
        </span>
      )}
      {suffix && <span className="text-xs text-white/45">{suffix}</span>}
      <ChevronRight className="h-4 w-4 text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-yellow" />
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-1 px-2 text-[11px] font-bold uppercase tracking-wider text-white/45">
      {children}
    </h3>
  );
}
