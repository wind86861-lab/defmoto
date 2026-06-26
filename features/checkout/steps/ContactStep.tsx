'use client';

import { User, Phone, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTelegram } from '@/components/providers/TelegramProvider';
import { useCheckoutState } from '../useCheckoutState';
import { useHaptic } from '@/hooks/useHaptic';

export function ContactStep({ onNext }: { onNext: () => void }) {
  const t = useTranslations('checkout');
  const { contact, setContact } = useCheckoutState();
  const { webApp, user } = useTelegram();
  const { notify } = useHaptic();

  const requestContact = () => {
    if (!webApp?.requestContact) {
      // Fallback for non-Telegram browsers
      notify('warning');
      return;
    }
    webApp.requestContact((shared) => {
      if (shared) {
        const tgUser = webApp.initDataUnsafe.user;
        if (tgUser) {
          setContact({
            name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' '),
          });
        }
        notify('success');
      }
    });
  };

  const canContinue =
    contact.name.trim().length >= 2 && /\+?\d{9,}/.test(contact.phone);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-display-sm font-extrabold">
          {t('contactTitle')}
        </h2>
        <p className="mt-1 text-sm text-white/55">
          {t('contactSubtitle')}
        </p>
      </header>

      {user && (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-yellow/30 bg-brand-yellow/8 p-3">
          {user.photo_url ? (
            <img
              src={user.photo_url}
              alt={user.first_name}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-yellow font-bold text-brand-dark">
              {user.first_name[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{user.first_name} {user.last_name}</p>
            {user.username && (
              <p className="text-xs text-white/55">@{user.username}</p>
            )}
          </div>
          <span className="rounded-full bg-brand-yellow/15 px-2 py-1 text-[10px] font-bold uppercase text-brand-yellow">
            {t('telegramBadge')}
          </span>
        </div>
      )}

      <div className="space-y-3">
        <Input
          placeholder={t('namePlaceholder')}
          leftIcon={<User className="h-4 w-4" />}
          value={contact.name}
          onChange={(e) => setContact({ name: e.target.value })}
        />
        <Input
          placeholder={t('phonePlaceholder')}
          type="tel"
          leftIcon={<Phone className="h-4 w-4" />}
          value={contact.phone}
          onChange={(e) => setContact({ phone: e.target.value })}
        />

        <Button
          variant="outline"
          fullWidth
          leftIcon={<Send className="h-4 w-4" />}
          onClick={requestContact}
        >
          {t('shareContactButton')}
        </Button>
      </div>

      <Button size="xl" glow fullWidth onClick={onNext} disabled={!canContinue}>
        {t('continue')}
      </Button>
    </div>
  );
}
