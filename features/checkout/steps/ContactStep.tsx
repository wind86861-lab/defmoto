'use client';

import { useEffect, useState } from 'react';
import { User, Phone, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { sanitizePhoneInput } from '@/lib/phoneInput';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/components/providers/TelegramProvider';
import { useCheckoutState } from '../useCheckoutState';

export function ContactStep({ onNext }: { onNext: () => void }) {
  const t = useTranslations('checkout');
  const { contact, setContact } = useCheckoutState();
  const { user, loading, refresh } = useAuth();
  const { user: tgUser, webApp } = useTelegram();
  const [sharing, setSharing] = useState(false);
  const [edited, setEdited] = useState(false);

  const tgName = tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : '';

  // Mirror the best-known identity into the form until the user edits it. The
  // REGISTERED account (name+phone from /api/auth/me) is authoritative but
  // arrives only after the Telegram auto-login finishes — so we must re-sync
  // when it loads instead of freezing on the Telegram profile name. Prefer the
  // account; fall back to the Telegram profile only while the account is absent.
  useEffect(() => {
    if (edited) return;
    const name = user?.name || tgName || '';
    const phone = user?.phone || '';
    if (name !== contact.name || phone !== contact.phone) {
      setContact({ name, phone });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name, user?.phone, tgName, edited]);

  // `contact` is the single source of truth so the fields stay editable.
  const name = contact.name;
  const phone = contact.phone;
  const ready = Boolean(name.trim() && phone.replace(/\D/g, '').length >= 9);

  // Telegram's requestContact shares the phone with the bot; poll /api/auth/me
  // a few times to pick up the linked phone, then prefill it.
  const shareViaTelegram = () => {
    if (!webApp?.requestContact) return;
    setSharing(true);
    webApp.requestContact((shared) => {
      if (!shared) {
        setSharing(false);
        return;
      }
      let tries = 0;
      const poll = async () => {
        tries += 1;
        await refresh();
        // useAuth updates async; re-read from the /api/auth/me directly too.
        try {
          const r = await fetch('/api/auth/me', { cache: 'no-store' });
          const j = await r.json();
          if (j?.user?.phone) {
            setContact({ name: j.user.name || name, phone: j.user.phone });
            setEdited(true);
            setSharing(false);
            return;
          }
        } catch {
          /* ignore */
        }
        if (tries < 6) setTimeout(poll, 1000);
        else setSharing(false);
      };
      void poll();
    });
  };

  const handleContinue = () => {
    // Remember the details on the Telegram account so next time they're
    // auto-filled (best-effort; never blocks checkout).
    if (webApp?.initData && ready) {
      void fetch('/api/auth/telegram/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone }),
      }).catch(() => {});
    }
    onNext();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <header>
          <h2 className="font-display text-display-sm font-extrabold">{t('contactTitle')}</h2>
        </header>
        <div className="rounded-2xl border border-brand-surface-border bg-brand-surface p-4 text-sm text-white/55">
          {t('loadingLabel')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-display-sm font-extrabold">{t('contactTitle')}</h2>
        <p className="mt-1 text-sm text-white/55">{t('contactMiniSubtitle')}</p>
      </header>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/45">
            {t('contactLabel')}
          </label>
          <Input
            value={name}
            onChange={(e) => {
              setContact({ name: e.target.value });
              setEdited(true);
            }}
            placeholder={t('contactNamePlaceholder')}
            leftIcon={<User className="h-4 w-4" />}
            autoComplete="name"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-white/45">{t('phoneLabel')}</label>
          <Input
            value={phone}
            onChange={(e) => {
              setContact({ phone: sanitizePhoneInput(e.target.value) });
              setEdited(true);
            }}
            placeholder={t('contactPhonePlaceholder')}
            leftIcon={<Phone className="h-4 w-4" />}
            inputMode="tel"
            autoComplete="tel"
            type="tel"
            maxLength={20}
          />
        </div>

        {/* One-tap phone share inside the mini app (Telegram shares it via the bot). */}
        {webApp?.requestContact && !phone && (
          <button
            type="button"
            onClick={shareViaTelegram}
            disabled={sharing}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> {sharing ? t('loadingLabel') : t('contactShareTg')}
          </button>
        )}
      </div>

      <Button size="xl" glow fullWidth onClick={handleContinue} disabled={!ready}>
        {t('continue')}
      </Button>
    </div>
  );
}
