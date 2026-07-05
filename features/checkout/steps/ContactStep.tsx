'use client';

import { useEffect } from 'react';
import { User, Phone, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useCheckoutState } from '../useCheckoutState';

const BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'ajndspuntnjqpiuuerbot';

export function ContactStep({ onNext }: { onNext: () => void }) {
  const t = useTranslations('checkout');
  const { contact, setContact } = useCheckoutState();
  const { user, loading } = useAuth();

  // We already know the customer (bot-registered) — pre-fill and don't ask.
  useEffect(() => {
    if (user?.name || user?.phone) {
      setContact({ name: user.name || contact.name, phone: user.phone || contact.phone });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name, user?.phone]);

  const name = user?.name || contact.name;
  const phone = user?.phone || contact.phone;
  const ready = Boolean(name && phone);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-display-sm font-extrabold">{t('contactTitle')}</h2>
        <p className="mt-1 text-sm text-white/55">{t('contactConfirmSubtitle')}</p>
      </header>

      {ready ? (
        <div className="space-y-2.5 rounded-2xl border border-brand-yellow/30 bg-brand-yellow/8 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-yellow text-brand-dark">
              <User className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/45">{t('contactLabel')}</p>
              <p className="truncate text-sm font-bold">{name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-dark/60 text-brand-yellow">
              <Phone className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/45">Tel</p>
              <p className="truncate text-sm font-bold">{phone}</p>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4 text-sm text-white/55">
          {t('loadingLabel')}
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-4">
          <p className="text-sm text-white/70">{t('contactNeedRegister')}</p>
          <a
            href={`https://t.me/${BOT}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 py-3 text-sm font-bold text-white"
          >
            <Send className="h-4 w-4" /> Telegram bot orqali roʻyxatdan oʻtish
          </a>
        </div>
      )}

      <Button size="xl" glow fullWidth onClick={onNext} disabled={!ready}>
        {t('continue')}
      </Button>
    </div>
  );
}
