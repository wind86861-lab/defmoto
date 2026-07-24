'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MoreHorizontal, User, LogIn, LogOut, Send, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/hooks/useAuth';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useHaptic } from '@/hooks/useHaptic';

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'ajndspuntnjqpiuuerbot';
const REGISTER_LINK = `https://t.me/${BOT_USERNAME}?start=register`;

/**
 * The header "…" overflow menu. Exposes the account actions that don't have a
 * dedicated header slot: profile/login and — since registration is bot-only —
 * a Register entry that opens the Telegram bot's /start register flow.
 */
export function HeaderMenu() {
  const t = useTranslations('common');
  const tNav = useTranslations('nav');
  const { user, logout } = useAuth();
  const { selection } = useHaptic();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  useClickOutside(ref, () => setOpen(false), open);

  const loggedIn = Boolean(user);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={t('more')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          selection();
          setOpen((v) => !v);
        }}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
          open
            ? 'bg-white/8 text-brand-yellow'
            : 'text-white/65 hover:bg-white/8 hover:text-brand-yellow',
        )}
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-2xl border border-brand-surface-border bg-brand-surface shadow-2xl animate-scale-in"
        >
          {loggedIn && (
            <div className="border-b border-brand-surface-border px-4 py-3">
              <p className="truncate text-sm font-bold text-white">{user?.name || tNav('profile')}</p>
              {user?.phone && <p className="mt-0.5 truncate text-xs text-white/50">{user.phone}</p>}
            </div>
          )}

          <div className="p-1.5">
            <MenuLink href="/profile" icon={<User className="h-4 w-4" />} onClick={() => setOpen(false)}>
              {tNav('profile')}
            </MenuLink>

            {loggedIn ? (
              <MenuButton
                icon={<LogOut className="h-4 w-4" />}
                onClick={() => {
                  setOpen(false);
                  void logout();
                }}
              >
                {t('logout')}
              </MenuButton>
            ) : (
              <>
                <MenuLink href="/login" icon={<LogIn className="h-4 w-4" />} onClick={() => setOpen(false)}>
                  {t('login')}
                </MenuLink>
                {/* Registration is bot-only — send the user to the Telegram bot. */}
                <a
                  href={REGISTER_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  role="menuitem"
                  className="mt-1 flex items-center gap-3 rounded-xl bg-[#229ED9] px-3 py-2.5 text-sm font-bold text-white transition-transform hover:brightness-110 active:scale-[0.98]"
                >
                  <Send className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{t('register')}</span>
                  <ChevronRight className="h-4 w-4 opacity-70" />
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/85 transition-colors hover:bg-white/8 hover:text-brand-yellow"
    >
      <span className="text-white/60">{icon}</span>
      <span className="flex-1">{children}</span>
    </Link>
  );
}

function MenuButton({
  icon,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/85 transition-colors hover:bg-danger/12 hover:text-danger"
    >
      <span className="text-white/60">{icon}</span>
      <span className="flex-1">{children}</span>
    </button>
  );
}
